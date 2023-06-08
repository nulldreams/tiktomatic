import { generateVoices } from './voice'
import { getPostContent } from './scrap/reddit'
import { cleanDirectory } from './utils/io'
import { generateVideo } from './video'

const POST_URL = 'https://www.reddit.com/r/AskReddit/comments/141elrw/what_is_the_greatest_fight_scene_of_all_time/'
const POST_COUNT = 1
const TRANSLATE_TO_BR = false

const main = async () => {
  try {
    await cleanDirectory('./output')
    const postContent = await getPostContent(POST_URL, POST_COUNT)
    await generateVoices(postContent, TRANSLATE_TO_BR)

    await delay(2000)

    await generateVideo(postContent.slug)
  } catch (error) {
    console.log(error)
  }
}

const delay = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

main()
