<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import linksData from './links.json'
import memesData from './memes.json'
import mascotUrl from './assets/nailoong-star.png'

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

function pickRandomQuote() {
  try {
    const quotes = memesData.quotes
    if (Array.isArray(quotes) && quotes.length > 0) {
      return quotes[Math.floor(Math.random() * quotes.length)]
    }
  } catch (e) {}
  return { text: "奶龙驾到,抽象拉满!", rarity: "保底款奶龙" }
}

const targetUrl = pickRandomLink()
const currentQuote = pickRandomQuote()

let targetHost = "未知次元"
try {
  targetHost = new URL(targetUrl).hostname
} catch (e) {}

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
    <div class="floaters">
      <span class="floater" :style="{ left: '5%', top: '8%', animationDelay: '0s' }">🐲</span>
      <span class="floater" :style="{ left: '15%', top: '70%', animationDelay: '0.7s' }">💛</span>
      <span class="floater" :style="{ left: '28%', top: '20%', animationDelay: '1.4s' }">😂</span>
      <span class="floater" :style="{ left: '40%', top: '80%', animationDelay: '0.3s' }">🐸</span>
      <span class="floater" :style="{ left: '55%', top: '12%', animationDelay: '1s' }">🔥</span>
      <span class="floater" :style="{ left: '68%', top: '75%', animationDelay: '1.7s' }">🍔</span>
      <span class="floater" :style="{ left: '82%', top: '25%', animationDelay: '0.5s' }">✨</span>
      <span class="floater" :style="{ left: '93%', top: '65%', animationDelay: '1.2s' }">🤣</span>
    </div>
    <img class="mascot" :src="mascotUrl" alt="奶龙" />
    <div class="logo">🐲 奶龙跳转站</div>
    <p class="slogan">抽象警报!奶龙正在接近…</p>
    <p class="quote">{{ currentQuote.text }}<span class="rarity">{{ currentQuote.rarity }}</span></p>
    <div class="countdown"><span class="countdown-number">{{ remainingSeconds }}</span>秒后发车</div>
    <p class="target-hint">即将穿越到：{{ targetHost }}</p>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: totalElapsed + '%' }"></div>
    </div>
    <p class="footer">本站链接与语录收录于 links.json / memes.json,构建时打包 · 图片来自奶龙官网</p>
  </div>
</template>
