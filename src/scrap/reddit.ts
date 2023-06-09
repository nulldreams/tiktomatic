import cliProgress from 'cli-progress'
import { PostContent } from './interfaces'
import puppeteer, { Page } from 'puppeteer'
import { success, info } from '../utils/log'
import { randomInt } from 'crypto'

const POST_TAG_NAME = 'shreddit-post'
const POST_TITLE_CLASS_NAME = '.text-neutral-content-strong'

const handlePostTitle = async (page: Page) => {
  await page.waitForSelector(POST_TAG_NAME)

  const element = await page.$(POST_TAG_NAME)
  await element?.screenshot({ path: './output/post.png' })
  let post = await page.$(`${POST_TAG_NAME} > ${POST_TITLE_CLASS_NAME}`)
  const postTitle = await page.evaluate((el) => el.textContent, post)

  return postTitle.trim()
}

const handlePostComments = async (page: Page, postsLimit: number) => {
  const comments = []

  await page.waitForSelector('shreddit-comment')
  const commentTags = await page.$$('shreddit-comment-tree > shreddit-comment')

  for (const [index, element] of commentTags.splice(0, postsLimit).entries()) {
    let div_selector_to_remove = `#comment-tree > shreddit-comment:nth-child(${index + 1}) > div > shreddit-comment`

    const exist = await page.$$(div_selector_to_remove)
    if (exist) {
      await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel)
        for (var i = 0; i < elements.length; i++) {
          elements[i].parentNode.removeChild(elements[i])
        }
      }, div_selector_to_remove)
    }

    let commentTag = await element.$('.max-w-full')
    const commentText = await page.evaluate((el) => el.textContent, commentTag)
    comments.push(commentText.trim())
    await element.screenshot({ path: `./output/${index}.png` })
  }

  return comments
}

export const getPostContent = async (url: string, postsLimit: number): Promise<PostContent> => {
  info('scrapping post')

  const browser = await puppeteer.launch({ headless: 'new' })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  await page.goto(url)

  success('screenshot post')
  const postTitle = await handlePostTitle(page)

  success('screenshot post comments')
  const comments = await handlePostComments(page, postsLimit)

  await browser.close()

  const splitedURL = url.split('/')

  success('scrapping post')
  return {
    slug: splitedURL[splitedURL.length - 2],
    title: postTitle,
    comments,
  }
}

export const chooseOnePost = async () => {
  const response = await fetch('https://www.reddit.com/r/AskReddit/top.json?t=day&limit=30')
  const responseData = await response.json()
  const posts = responseData.data.children

  const safePosts = posts.filter((post) => post.data.whitelist_status !== 'nsfw' && !post.data.over_18)

  return safePosts[randomInt(0, safePosts.length - 1)].data
}
