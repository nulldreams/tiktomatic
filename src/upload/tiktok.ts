import { tiktokAmzDate } from '../utils/date'
import fs from 'fs'
import { sizeOfFile } from '../utils/io'
import { error, info, success } from '../utils/log'
import { SessionIdExpired } from './error'
import { makeAwsSignature } from './aws4'
import { UploadParameters, retrieveUploadParameters } from './retrieves'
import { randomInt } from 'crypto'
import { crcCalc, hash } from '../utils/hash'
import querystring from 'querystring'
import { createRequestInstance } from './request'
import { AxiosInstance } from 'axios'

const VOD_URL = 'https://vod-us-east-1.bytevcloudapi.com/'
const CREATE_VIDEO_URL = 'https://www.tiktok.com/api/v1/item/create/'

interface UploadData {
  video_id: String
  store_uri: String
  video_auth: String
  upload_host: String
  session_key: String
}

interface VerifiedTags {
  text: string
  text_extra: string[]
}

export interface VideoData {
  path: string
  title: string
  tags: string[]
}

export const upload = async (videoData: VideoData, sessionId: string) => {
  info('uploading to tiktok')
  const request = createRequestInstance(sessionId)

  const uploadConfiguration = await retrieveUploadParameters(request)
  const uploadData = await buildUploadData(videoData.path, uploadConfiguration)
  const uploadId = await getUploadId(request, uploadData)
  const crcs = await uploadFileChunks(request, uploadData, videoData.path, uploadId)
  await uploadFileChecksums(request, uploadData, uploadId, crcs)
  await commitUpload(request, uploadData, uploadConfiguration)
  await createTiktokVideo(request, videoData.title, videoData.tags, uploadData)
  success('uploading to tiktok')
}

const createTiktokVideo = async (request: AxiosInstance, title: string, tags: string[], uploadData: UploadData) => {
  info('finalizing upload to tiktok')
  const { text, text_extra } = await verifyVideoHashtags(request, title, tags)

  const csrfToken = await getCSRFToken(request)

  const headers = {
    'X-Secsdk-Csrf-Token': csrfToken,
  }

  const params = JSON.stringify({
    video_id: uploadData.video_id,
    visibility_type: '0',
    poster_delay: '0',
    text: text,
    text_extra: JSON.stringify(text_extra),
    allow_comment: '1',
    allow_duet: '0',
    allow_stitch: '0',
    sound_exemption: '0',
    aid: '1988',
  })

  const response = await request.post('https://www.tiktok.com/api/v1/item/create/?' + querystring.stringify(JSON.parse(params)), {}, { headers })

  if (response.data.status_code !== 0) {
    throw new Error()
  }

  success('finalizing upload to tiktok')
}

const getCSRFToken = async (request: AxiosInstance) => {
  const createUrl = CREATE_VIDEO_URL
  const headers = {
    'X-Secsdk-Csrf-Request': '1',
    'X-Secsdk-Csrf-Version': '1.2.8',
  }

  const response = await request(createUrl, { method: 'HEAD', headers: headers })

  return response.headers['x-ware-csrf-token'].split(',')[1]
}

const verifyVideoHashtags = async (request: AxiosInstance, title: string, tags: string[]): Promise<VerifiedTags> => {
  info('verifying post hashtags')
  let text = title
  let textExtra = []

  for (const tag of tags) {
    const url = 'https://www.tiktok.com/api/upload/challenge/sug/'
    const params = { keyword: tag }

    const queryString = querystring.stringify(params)
    const response = await request(`${url}?${queryString}`)

    let verifiedTag
    try {
      const responseData = response.data
      verifiedTag = responseData.sug_list[0].cha_name
    } catch (error) {
      verifiedTag = tag
    }

    text += ` #${verifiedTag}`
    textExtra.push({
      start: text.length - verifiedTag.length - 1,
      end: text.length,
      user_id: '',
      type: 1,
      hashtag_name: verifiedTag,
    })
  }

  success('verifying post hashtags')
  return { text, text_extra: textExtra }
}

const commitUpload = async (request: AxiosInstance, uploadData: UploadData, uploadParameters: UploadParameters) => {
  info('committing video upload to aws')
  const requestParameters = 'Action=CommitUploadInner&SpaceName=tiktok&Version=2020-11-19'

  const date = tiktokAmzDate()
  const data = `{"SessionKey":"${uploadData.session_key}","Functions":[]}`
  const amzContentSha256 = hash(data, 'hex')

  const headers = {
    'x-amz-content-sha256': amzContentSha256,
    'x-amz-date': date.datetime,
    'x-amz-security-token': uploadParameters.tokens.session_token,
  }

  const signature = makeAwsSignature(uploadParameters, requestParameters, headers, 'POST', data)
  const authorization = `AWS4-HMAC-SHA256 Credential=${uploadParameters.tokens.access_key}/${date.datestamp}/us-east-1/vod/aws4_request, SignedHeaders=x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=${signature}`

  headers['authorization'] = authorization
  headers['Content-Type'] = 'text/plain;charset=UTF-8'

  const response = await request.post(`${VOD_URL}?${requestParameters}`, data, {
    headers: headers,
  })

  success('committing video upload to aws')
}

const uploadFileChecksums = async (request: AxiosInstance, uploadData, uploadId: string, crcs) => {
  info('uploading file checksums')
  const url = `https://${uploadData.upload_host}/${uploadData.store_uri}?uploadID=${uploadId}`
  const headers = {
    Authorization: uploadData.video_auth,
    'Content-Type': 'text/plain;charset=UTF-8',
  }
  const data = crcs.map((crc, i) => `${i + 1}:${crc}`).join(',')

  const response = await request.post(url, data, {
    headers: headers,
  })

  success('uploading file checksums')
}

const uploadFileChunks = async (request: AxiosInstance, uploadData, videoPath: string, uploadId: string) => {
  info('uploading file chunks')
  const fileContent = await fs.readFileSync(videoPath)
  const fileLength = fileContent.length

  const chunkSize = 5242880
  const chunks = []
  const crcs = []
  let i = 0
  while (i < fileLength) {
    chunks.push(fileContent.slice(i, i + chunkSize))
    i += chunkSize
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const crc = crcCalc(chunk)
    crcs.push(crc)

    const url = `https://${uploadData.upload_host}/${uploadData.store_uri}?partNumber=${i + 1}&uploadID=${uploadId}`
    const headers = {
      Authorization: uploadData.video_auth,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="undefined"',
      'Content-Crc32': crc,
    }

    const response = await request.post(url, chunk, {
      method: 'POST',
      headers: headers,
    })
  }

  success('uploading file chunks')
  return crcs
}

const getUploadId = async (request: AxiosInstance, uploadData) => {
  info('generating upload Id')
  const uploadUrl = `https://${uploadData.upload_host}/${uploadData.store_uri}?uploads`
  const randomDigit = randomInt(0, 9)

  const headers = {
    Authorization: uploadData.video_auth,
    'Content-Type': `multipart/form-data; boundary=---------------------------${randomDigit}`,
  }
  const data = `-----------------------------${randomDigit}--`

  const response = await request.post(uploadUrl, data, {
    headers: headers,
  })

  const responseData = response.data

  success('generating upload Id')
  return responseData.payload.uploadID
}

const buildUploadData = async (videopath: string, uploadParameters: UploadParameters): Promise<UploadData> => {
  info('creating aws4 signatures')
  const videoFileSize = await sizeOfFile(videopath)
  const requestParameters = `Action=ApplyUploadInner&FileSize=${videoFileSize}&FileType=video&IsInner=1&SpaceName=tiktok&Version=2020-11-19&s=zdxefu8qvq8`
  const date = tiktokAmzDate()

  const headers = {
    'x-amz-date': date.datetime,
    'x-amz-security-token': uploadParameters.tokens.session_token,
  }

  const signature = makeAwsSignature(uploadParameters, requestParameters, headers)
  const authorization = `AWS4-HMAC-SHA256 Credential=${uploadParameters.tokens.access_key}/${date.datestamp}/us-east-1/vod/aws4_request, SignedHeaders=x-amz-date;x-amz-security-token, Signature=${signature}`
  headers['authorization'] = authorization
  const response = await fetch(`${VOD_URL}?${requestParameters}`, { headers })
  const responseData = await response.json()

  const uploadNode = responseData['Result']['InnerUploadAddress']['UploadNodes'][0]

  success('creating aws4 signatures')
  return {
    video_id: uploadNode['Vid'],
    store_uri: uploadNode['StoreInfos'][0]['StoreUri'],
    video_auth: uploadNode['StoreInfos'][0]['Auth'],
    upload_host: uploadNode['UploadHost'],
    session_key: uploadNode['SessionKey'],
  }
}
