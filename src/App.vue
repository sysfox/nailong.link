<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const targetUrl = ref(pickRandomLink(categoryId))
const categoryName = categories[categoryId].name

function toDisplay(url) {
  const video = url.match(/\/video\/(BV\w+)/i)
  if (video) return video[1]
  const host = url.match(/^https?:\/\/([^/?#]+)/i)
  return host ? host[1] : url
}
const displayUrl = computed(() => toDisplay(targetUrl.value))

let timer = null

function startCountdown() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    window.location.href = targetUrl.value
  }, REDIRECT_DELAY)
}

function handlePageShow(event) {
  if (event.persisted) {
    targetUrl.value = pickRandomLink(categoryId)
    startCountdown()
  }
}

onMounted(() => {
  document.title = `${categories[categoryId].name}跳转中…`
  startCountdown()
  window.addEventListener('pageshow', handlePageShow)
})

onUnmounted(() => {
  window.removeEventListener('pageshow', handlePageShow)
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})
</script>

<template>
  <main class="stage">
    <div class="rings" role="status" :aria-label="`即将前往${categoryName}，马上跳转`">
      <div class="ring ring-outer"></div>
      <div class="ring ring-middle"></div>
      <div class="ring ring-inner"></div>
    </div>
    <p class="hint-category">即将前往<span>「{{ categoryName }}」</span></p>
    <p class="hint-url" :title="targetUrl">{{ displayUrl }}</p>
  </main>
  <footer class="footer">
    <a href="https://github.com/sysfox/nailong.link" target="_blank" rel="noopener">GitHub</a>
    <a
      href="https://ocn59mj1gt20.feishu.cn/share/base/form/shrcnRK52RYPfeMLJZxkHLeQg2g"
      target="_blank"
      rel="noopener">提交链接</a
    >
  </footer>
</template>
