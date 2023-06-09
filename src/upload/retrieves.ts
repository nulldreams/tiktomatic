import { AxiosInstance } from 'axios'
import { info, success } from '../utils/log'
import { SessionIdExpired } from './error'

const UPLOAD_URL = 'https://www.tiktok.com/upload/'
const ACCOUNT_INFO_URL = 'https://www.tiktok.com/passport/web/account/info/'
const UPLOAD_TOKEN_AND_SECRET_URL = 'https://www.tiktok.com/api/v1/video/upload/auth/'

export interface UploadParameters {
  account: {
    user_id: string
  }
  tokens: {
    access_key: string
    secret_key: string
    session_token: string
  }
}

const retrieveAccountInfo = async (request: AxiosInstance) => {
  info('retrieving account info')

  const response = await request(ACCOUNT_INFO_URL)
  const accountInfo = response.data

  if (!accountInfo?.data?.user_id_str) throw new SessionIdExpired()

  success('retrieving account info')
  return {
    user_id: accountInfo?.data?.user_id_str,
  }
}

const checkIfuploadUrlIsWorking = async (request: AxiosInstance) => {
  info('testing upload url')

  const response = await request(UPLOAD_URL)

  if (response.headers['Link']) throw new SessionIdExpired()

  success('testing upload url')
  return true
}

const retrieveUploadAccessTokenAndSecret = async (request: AxiosInstance) => {
  info('retrieving upload tokens')

  const response = await request(UPLOAD_TOKEN_AND_SECRET_URL)
  const uploadTokens = response.data

  if (!uploadTokens?.video_token_v5) throw new SessionIdExpired()

  const videoTokens = uploadTokens?.video_token_v5

  success('retrieving upload tokens')
  return {
    access_key: videoTokens.access_key_id,
    secret_key: videoTokens.secret_acess_key,
    session_token: videoTokens.session_token,
  }
}

export const retrieveUploadParameters = async (request: AxiosInstance): Promise<UploadParameters> => {
  info('retrieving upload parameters')
  await checkIfuploadUrlIsWorking(request)

  const accountInfo = await retrieveAccountInfo(request)
  const uploadTokenAndSecret = await retrieveUploadAccessTokenAndSecret(request)

  return {
    account: accountInfo,
    tokens: uploadTokenAndSecret,
  }
}
