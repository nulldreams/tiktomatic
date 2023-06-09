import axios from 'axios'
import tough from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const cookieJar = new tough.CookieJar()

wrapper(axios)

export const createRequestInstance = (sessionId: string) => {
  return axios.create({
    withCredentials: true,
    headers: { Cookie: `sessionid=${sessionId}; domain=.tiktok.com` },
    jar: cookieJar,
  })
}
