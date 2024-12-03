<template>
  <div class="w-80 p-4 bg-white">
    <h1 class="text-xl font-bold mb-4">Zetly</h1>
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-gray-700">快捷键</span>
        <span class="text-gray-500">Alt + N</span>
      </div>
      <button
        @click="toggleBookmark"
        class="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        打开书签
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { browser } from 'wxt/browser';

async function toggleBookmark() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_UI' });
    window.close();
  }
}
</script>
