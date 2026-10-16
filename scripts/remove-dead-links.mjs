#!/usr/bin/env node
// 按 check-links.mjs 生成的结果，从 src/*.json 中移除挂掉的链接
// 用法: node scripts/remove-dead-links.mjs [--src-dir src] [--out dead-links.json]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name, def) => {
    const i = args.indexOf(`--${name}`)
    return i !== -1 && args[i + 1] ? args[i + 1] : def
  }
  return {
    srcDir: resolve(get('src-dir', 'src')),
    out: get('out', 'dead-links.json')
  }
}

const opts = parseArgs()

if (!existsSync(opts.out)) {
  console.log(`没有找到验活结果 ${opts.out}，无事可做。`)
  process.exit(0)
}

let entries
try {
  entries = JSON.parse(readFileSync(opts.out, 'utf8'))
} catch (err) {
  console.error(`验活结果不是合法 JSON：${err.message}`)
  process.exit(1)
}
if (!Array.isArray(entries)) entries = []

// 按文件归组死链
const grouped = new Map()
for (const entry of entries) {
  if (typeof entry?.file !== 'string' || typeof entry?.url !== 'string') continue
  const path = resolve(join(opts.srcDir, entry.file))
  if (!path.startsWith(opts.srcDir)) {
    console.error(`跳过 ${entry.url}：${entry.file} 不在 ${opts.srcDir} 内`)
    continue
  }
  if (!grouped.has(path)) grouped.set(path, new Set())
  grouped.get(path).add(entry.url)
}

let removed = 0
for (const [path, deadUrls] of grouped) {
  const data = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(data.links)) {
    console.error(`${path} 中没有 links 数组，跳过`)
    continue
  }
  const before = data.links.length
  data.links = data.links.filter((url) => !deadUrls.has(url))
  if (data.links.length === before) continue
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  removed += before - data.links.length
  console.error(`  ${path}: ${before - data.links.length} 条`)
}

if (removed === 0) {
  console.log('没有实际移除任何链接。')
  process.exit(0)
}
console.log(`共移除 ${removed} 条链接。`)
