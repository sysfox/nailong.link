<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import linksData from './links.json'

const remainingSeconds = ref(5)
const totalElapsed = ref(0)

let timer = null

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
const isImminent = computed(() => remainingSeconds.value <= 3)

onMounted(() => {
  timer = setInterval(() => {
    remainingSeconds.value = remainingSeconds.value - 1
    totalElapsed.value = (5 - remainingSeconds.value) * 20
    if (remainingSeconds.value <= 0) {
      clearInterval(timer)
      timer = null
      window.location.href = targetUrl
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="app" :class="{ 'is-imminent': isImminent }">
    <div class="logo">🐲 奶龙跳转站</div>
    <p class="slogan">即将带你穿越到奶龙的世界…</p>
    <div class="countdown">
      <span class="countdown-number">{{ remainingSeconds }}</span>
      秒后跳转
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: totalElapsed + '%' }"></div>
    </div>
    <p class="footer">链接清单收录于 src/links.json,构建时随站点打包</p>
  </div>
</template>
