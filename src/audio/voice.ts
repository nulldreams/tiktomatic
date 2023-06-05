import { spawn } from 'child_process'
import { PostContent } from '../scrap/interfaces'

const generateVoiceClip = async (text, title) => {
  const python = spawn('python', ['lib/generate-audio-clip.py', '-t', text, '-n', title])

  python.stdout.on('data', function (data) {
    console.log(data.toString())
  })
}

export const generateVoices = async (postContent: PostContent): Promise<boolean> => {
  console.log('Generating MP3 Audio Files')
  await generateVoiceClip(postContent.title, 'post')

  for (const [index, comment] of postContent.comments.entries()) {
    await generateVoiceClip(comment, `post-${index}`)
  }

  return true
}
