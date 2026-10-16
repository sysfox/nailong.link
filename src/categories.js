import memes from './links.json'
import nailongUniversity from './nailongUniversity.json'

export const DEFAULT_CATEGORY_ID = 'memes'

// 新增子列表时在这里注册即可：id -> { name, fallback, links }
const categories = {
  [DEFAULT_CATEGORY_ID]: memes,
  'nailong-university': nailongUniversity
}

export default categories
