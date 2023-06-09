import fs from 'fs'
import path from 'path'
import { success, info } from './log'

export const cleanDirectory = async (directory: string) => {
  info('removing old output files')
  const files = await fs.readdirSync(directory)
  for (const file of files) {
    await fs.unlinkSync(path.join(directory, file))
  }
  success('removing old output files')
}

export const sizeOfFile = async (filepath: string) => {
  const fileStats = await fs.statSync(filepath)

  return fileStats.size
}
