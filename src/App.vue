<script setup>
import { onMounted, onUnmounted } from 'vue'
import categories, { DEFAULT_CATEGORY_ID } from './categories'

const REDIRECT_DELAY = 5000

function resolveCategory(loc) {
  let id = ''
  const segment = loc.pathname.split('/').filter(Boolean)[0]
  if (segment && categories[segment]) id = segment
  if (!id) {
    const cat = new URLSearchParams(loc.search).get('cat')
    if (cat && categories[cat]) id = cat
  }
  if (!id && loc.hash) {
    const hash = decodeURIComponent(loc.hash.replace(/^#\/?/, ''))
    if (categories[hash]) id = hash
  }
  return id || DEFAULT_CATEGORY_ID
}

function pickRandomLink(categoryId) {
  const data = categories[categoryId]
  try {
    const links = data.links
    if (Array.isArray(links) && links.length > 0) {
      return links[Math.floor(Math.random() * links.length)]
    }
  } catch (e) {}
  return data.fallback
}

const categoryId = resolveCategory(window.location)
const targetUrl = pickRandomLink(categoryId)
let timer = null

onMounted(() => {
  document.title = `${categories[categoryId].name}跳转中…`
  timer = setTimeout(() => {
    window.location.href = targetUrl
  }, REDIRECT_DELAY)
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})
</script>

<template>
  <main class="stage">
    <div class="rings" role="status" aria-label="正在召唤奶龙，马上跳转">
      <div class="ring ring-outer"></div>
      <div class="ring ring-middle"></div>
      <div class="ring ring-inner"></div>
    </div>
  </main>
</template>
