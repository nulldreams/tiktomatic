import { spawn } from 'child_process'
import { PostContent } from '../scrap/interfaces'

const generateVoiceClip = async (text: string, title: string, translate: boolean = false) => {
  const python = spawn('python', ['lib/generate-audio-clip.py', '-t', text, '-n', title, '-tr', translate ? 'True' : 'False'])

  python.stdout.on('data', function (data) {})
}

const translateText = async (text): Promise<string> => {
  const python = spawn('python', ['lib/translate-text.py', '-t', text])

  return new Promise((resolve, reject) => {
    python.stdout.on('data', function (data) {
      if (!data) return text

      return resolve(data.toString())
    })
  })
}

export const generateVoices = async (postContent: PostContent, translate?: boolean): Promise<boolean> => {
  console.log('Generating MP3 Audio Files')

  if (translate) {
    const commentsTranslated = []

    console.log('Translating Post Title and Comments')
    const titleTranslated = await translateText(postContent.title)
    await generateVoiceClip(titleTranslated, 'post-translated', true)

    for (const [index, comment] of postContent.comments.entries()) {
      const translatedComment = await translateText(comment)
      await generateVoiceClip(translatedComment, `post-${index}-translated`, true)

      commentsTranslated.push(translatedComment)
    }
  }

  await generateVoiceClip(postContent.title, 'post', false)

  for (const [index, comment] of postContent.comments.entries()) {
    await generateVoiceClip(comment, `post-${index}`, false)
  }

  return true
}
