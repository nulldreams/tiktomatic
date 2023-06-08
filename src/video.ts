import { spawn } from 'child_process'
import { info, success } from './utils/log'

export const generateVideo = async (outputName: string) => {
  info('generating video')

  const python = spawn('python', ['lib/generate-video.py', '-n', outputName])

  return new Promise((resolve, reject) => {
    python.stdout.on('data', function (data) {
      if (data.toString().indexOf('VIDEO_WAS_CREATED') > -1) {
        success('generating video')
        return resolve(true)
      }
    })
  })
}
