import memes from './links.json'
import nailongUniversity from './nailongUniversity.json'

export const DEFAULT_CATEGORY_ID = 'all'

// 新增子列表时在这里注册即可：id -> { name, fallback, links }
const categories = {
  memes,
  'nailong-university': nailongUniversity
}

// 根域默认从所有子列表合并的链接中随机跳转
categories[DEFAULT_CATEGORY_ID] = {
  name: '奶龙',
  fallback: memes.fallback,
  links: Object.values(categories).flatMap((category) => category.links)
}

export default categories
