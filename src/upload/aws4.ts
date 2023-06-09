import crypto from 'crypto'
import { UploadParameters } from './retrieves'
import { hash, hmac } from '../utils/hash'

const ALGORITHM = 'AWS4-HMAC-SHA256'
const AWS_REGION = 'us-east-1'
const AWS_SERVICE = 'vod'

export const makeAwsSignature = (uploadParameters: UploadParameters, requestParameters: string, headers: Record<string, string>, method = 'GET', payload = '') => {
  const amzdate = headers['x-amz-date']
  const datestamp = amzdate.split('T')[0]

  const stringToSign = makeStringToSign(requestParameters, headers, method, payload)
  const sigingKey = getSignatureKey(uploadParameters.tokens.secret_key, datestamp, AWS_REGION, AWS_SERVICE)

  const signature = hmac(sigingKey, stringToSign, 'hex')

  return signature
}

const toUtf8 = (text: string) => Buffer.from(text, 'utf8').toString('utf8')

const getSignatureKey = (key: string, datestamp: string, regionName: string, serviceName: string) => {
  //@ts-ignore
  const date = hmac('AWS4' + key, datestamp)
  //@ts-ignore
  const region = hmac(date, regionName)
  //@ts-ignore
  const service = hmac(region, serviceName)
  //@ts-ignore
  const signKey = hmac(service, 'aws4_request')

  return signKey
}

const makeCanonicalRequest = (requestParameters: string, headers: Record<string, string>, method = 'GET', payload = '') => {
  const canonicalURL = '/'
  const canonicalQueryString = requestParameters
  const signedHeaders = Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort()
    .join(';')
  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex')
  const canonicalHeaders =
    Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join('\n') + '\n'

  return method + '\n' + canonicalURL + '\n' + canonicalQueryString + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash
}

const makeStringToSign = (requestParameters: string, headers: Record<string, string>, method = 'GET', payload = '') => {
  const amzdate = headers['x-amz-date']
  const datestamp = amzdate.split('T')[0]
  const credentialScope = `${datestamp}/${AWS_REGION}/${AWS_SERVICE}/aws4_request`
  const canonicalURL = makeCanonicalRequest(requestParameters, headers, method, payload)

  return ALGORITHM + '\n' + amzdate + '\n' + credentialScope + '\n' + hash(canonicalURL, 'hex')
}
