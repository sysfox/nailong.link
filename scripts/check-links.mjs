#!/usr/bin/env node
// 读取 src/*.json 中的所有链接并验活，输出挂掉的链接列表
// 用法: node scripts/check-links.mjs [--src-dir src] [--out dead-links.json]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name, def) => {
    const i = args.indexOf(`--${name}`)
    return i !== -1 && args[i + 1] ? args[i + 1] : def
  }
  return {
    srcDir: get('src-dir', 'src'),
    out: get('out', 'dead-links.json'),
    retries: Number(get('retries', 3)),
    timeoutMs: Number(get('timeout-ms', 15000)),
    concurrency: Number(get('concurrency', 5)),
    gapMs: Number(get('gap-ms', 300))
  }
}

const opts = parseArgs()

// 验活用的伪浏览器请求头，绕开最简单的 UA 拦截
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 检查单个链接。返回 null 表示活着，返回字符串表示挂掉的原因
async function checkUrl(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: HEADERS
    })
    // 2xx/3xx 正常；403/405/412/429/999 等多为反爬虫误伤，视为存活
    if (res.status < 400) return null
    if ([403, 405, 412, 429, 999].includes(res.status)) return null
    if (res.status === 404 || res.status === 410 || res.status >= 500) {
      return `HTTP ${res.status}`
    }
    return null
  } catch (err) {
    return err.name === 'AbortError' ? `超时 ${opts.timeoutMs}ms` : (err.cause?.code ?? err.message)
  } finally {
    clearTimeout(timer)
  }
}

async function checkWithRetry(label, url) {
  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    const reason = await checkUrl(url)
    if (reason === null) return null
    if (attempt === opts.retries) {
      console.error(`已挂 ${label} <${url}> (${attempt}/${opts.retries}): ${reason}`)
      return reason
    }
    console.error(`重试 ${label} <${url}> (${attempt}/${opts.retries}): ${reason}`)
    await sleep(1200 * attempt)
  }
  return null
}

// 同时只跑 opts.concurrency 个请求，避免同一个域名同时发起太多请求
async function runPool(items, worker, size) {
  let cursor = 0
  const results = []
  async function lane() {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      const result = await worker(items[i])
      await sleep(opts.gapMs)
      results[i] = result
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, size) }, lane))
  return results
}

function loadCategories() {
  const files = readdirSync(opts.srcDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  const categories = []
  for (const file of files) {
    const path = join(opts.srcDir, file)
    let data
    try {
      data = JSON.parse(readFileSync(path, 'utf8'))
    } catch (err) {
      console.error(`跳过无法解析的 ${path}: ${err.message}`)
      continue
    }
    if (!Array.isArray(data.links)) continue
    categories.push({ file, path, data, links: [...new Set(data.links)] })
  }
  return categories
}

const categories = loadCategories()
if (categories.length === 0) {
  console.error(`${opts.srcDir} 下没有找到包含 links 数组的 JSON 文件`)
  process.exit(1)
}

const totalLinks = categories.reduce((sum, c) => sum + c.links.length, 0)
console.error(`共 ${categories.length} 个列表 / ${totalLinks} 条链接，开始验活…`)

const dead = []
for (const category of categories) {
  const pairs = category.links.map((url) => ({ label: `${category.file}`, url }))
  const outcomes = await runPool(pairs, ({ url }) => checkWithRetry(category.file, url), opts.concurrency)
  pairs.forEach(({ url }, i) => {
    if (outcomes[i] !== null) dead.push({ file: category.file, url, reason: outcomes[i] })
  })
}

if (dead.length === 0) {
  console.error('全部链接存活，无需清理。')
  process.exit(0)
}

console.error(`发现 ${dead.length} 条疑似挂掉的链接：`)
for (const { file, url, reason } of dead) {
  console.error(`  [${file}] ${url} (${reason})`)
}

writeFileSync(opts.out, JSON.stringify(dead, null, 2) + '\n')
console.error(`已写入 ${opts.out}`)

// 无论如何都退出 0，由 workflow 判断结果文件决定是否开 PR
process.exit(0)
