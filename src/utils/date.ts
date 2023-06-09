// 20230609T140515Z amzdate    %Y%m%dT%H%M%SZ
// 20230609         datestamp  %Y%m%d

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('America/New_York')

export const tiktokAmzDate = () => {
  const today = dayjs().utc()
  const amzdate = today.format('YYYYMMDDTHmmss') + 'Z'
  const datestamp = today.format('YYYYMMDD')

  const date = new Date(new Date())

  const datetime = date.toISOString().replace(/[:\-]|\.\d{3}/g, '')

  return { amzdate, datestamp, datetime }
}
