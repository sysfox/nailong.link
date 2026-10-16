<script setup>
import { onMounted, onUnmounted } from 'vue'
import linksData from './links.json'

const REDIRECT_DELAY = 3000

function pickRandomLink() {
  try {
    const links = linksData.links
    if (Array.isArray(links) && links.length > 0) {
      return links[Math.floor(Math.random() * links.length)]
    }
  } catch (e) {}
  return linksData.fallback
}

const targetUrl = pickRandomLink()
let timer = null

onMounted(() => {
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
