import fs from 'fs'
import path from 'path'

export const cleanDirectory = async (directory: string) => {
  const files = await fs.readdirSync(directory)
  for (const file of files) {
    await fs.unlinkSync(path.join(directory, file))
  }
}
