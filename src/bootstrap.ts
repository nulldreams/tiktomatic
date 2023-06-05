import { generateVoices } from './audio/voice'
import { getPostContent } from './scrap/reddit'
import { cleanDirectory } from './utils/io'

const POST_URL = 'https://www.reddit.com/r/AskReddit/comments/141elrw/what_is_the_greatest_fight_scene_of_all_time/'
const POST_COUNT = 5
const TRANSLATE_TO_BR = false

const main = async () => {
  try {
    await cleanDirectory('./output')

    const postContent = await getPostContent(POST_URL, POST_COUNT)
    await generateVoices(postContent, TRANSLATE_TO_BR)
  } catch (error) {
    console.log(error)
  }
}

main()
