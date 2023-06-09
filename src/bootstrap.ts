import { generateVoices } from './voice'
import { chooseOnePost, getPostContent } from './scrap/reddit'
import { cleanDirectory } from './utils/io'
import { generateVideo } from './video'
import { upload } from './upload/tiktok'
import { error } from './utils/log'

const SESSION_ID = 'a4f38facc3c3df069daf9c5f69bc5dad'
const TAGS = ['reddit', 'story']
const POST_COUNT = 5
const TRANSLATE_TO_BR = false

const main = async () => {
  try {
    const post = await chooseOnePost()
    await cleanDirectory('./output')
    const postContent = await getPostContent(post.url, POST_COUNT)
    await generateVoices(postContent, TRANSLATE_TO_BR)

    await delay(2000)

    await generateVideo(postContent.slug)

    const videoData = {
      path: `render/${postContent.slug}.mp4`,
      tags: TAGS,
      title: postContent.title,
    }

    await upload(videoData, SESSION_ID)
  } catch (err) {
    error(err)
  }
}

const delay = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

main()
