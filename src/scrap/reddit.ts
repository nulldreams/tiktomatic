import { PostContent } from './interfaces'

import puppeteer from 'puppeteer'

export const getPostContent = async (url: string, postCount: number): Promise<PostContent> => {
  const comments = []

  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  await page.goto(url)

  await page.waitForSelector('shreddit-post')

  console.log('Scrap Screenshot - Post Title')

  const element = await page.$('shreddit-post')
  await element?.screenshot({ path: './output/post.png' })
  let post = await page.$('shreddit-post > .text-neutral-content-strong')
  const postTitle = await page.evaluate((el) => el.textContent, post)

  await page.waitForSelector('shreddit-comment')
  const commentTags = await page.$$('shreddit-comment-tree > shreddit-comment')

  console.log('Scrap Screenshot - Post Comments')
  for (const [index, element] of commentTags.splice(0, postCount).entries()) {
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
    await element.screenshot({ path: `./output/post-${index}.png` })
  }

  await browser.close()

  console.log('Scrap Screenshot - Done')

  return {
    title: postTitle,
    comments,
  }
}
