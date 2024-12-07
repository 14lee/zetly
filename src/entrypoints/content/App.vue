<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { browser } from 'wxt/browser';
import BookmarkTree from './components/BookmarkTree.vue';

interface BookmarkResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

const close = () => {
  window.dispatchEvent(new CustomEvent('close-overlay'));
}

// 搜索关键词
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const bookmarks = ref<any[]>([]);

// 显示模式
const displayMode = ref<'tree' | 'list'>('tree');
const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'tree' ? 'list' : 'tree';
};

// 聚焦到搜索框
const focusSearchInput = () => {
  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 获取书签数据
const fetchBookmarks = async () => {
  try {
    console.log('Requesting bookmarks from background...');
    const response = await browser.runtime.sendMessage({ type: 'GET_BOOKMARKS' }) as BookmarkResponse;
    console.log('Response from background:', response);
    if (response.success) {
      bookmarks.value = response.data || [];
      // 获取数据后聚焦到搜索框
      focusSearchInput();
    } else {
      console.error('Failed to get bookmarks:', response.error);
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
  }
};

// 处理编辑事件
const handleEdit = async (bookmark: any) => {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'UPDATE_BOOKMARK',
      bookmark
    }) as BookmarkResponse;
    if (response.success) {
      bookmarks.value = response.data || [];
    } else {
      console.error('Failed to update bookmark:', response.error);
    }
  } catch (error) {
    console.error('Error updating bookmark:', error);
  }
};

// 处理删除事件
const handleDelete = async (bookmark: any) => {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'DELETE_BOOKMARK',
      bookmark
    }) as BookmarkResponse;
    if (response.success) {
      bookmarks.value = response.data || [];
    } else {
      console.error('Failed to delete bookmark:', response.error);
    }
  } catch (error) {
    console.error('Error deleting bookmark:', error);
  }
};

// 初始化时获取书签数据
onMounted(() => {
  fetchBookmarks();
  // 监听 TOGGLE_UI 消息，每次打开时都聚焦
  browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'TOGGLE_UI') {
      focusSearchInput();
    }
  });
});
</script>

<template>
  <div id="bookmark">
    <div @click="close" class="overlay fixed top-0 left-0 w-full h-full pointer-events-auto bg-gradient-to-r from-black/30 to-black/30 bg-[#fff3]">
      <div class="modal mt-[25vh] mx-auto w-30[vw] min-w-[560px] max-w-[640px] h-[50vh] flex flex-col rounded-[12px] bg-gradient-to-r from-white to-white bg-[#26262633] shadow-[0_0_2px_rgba(0,0,0,0.05),_0_38px_90px_rgba(0,0,0,0.25)]" @click.stop>
        <!-- 固定头部 -->
        <div class="flex-none">
          <!-- 标题栏 -->
          <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800">书签管理器</h2>
            <button @click="close" class="text-gray-500 hover:text-gray-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 搜索框和视图切换 -->
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="flex items-center space-x-4">
              <div class="relative flex-1">
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索书签..."
                  class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:border-blue-500"
                >
                <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <!-- 视图切换按钮 -->
              <button
                class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg flex items-center space-x-2 transition-colors duration-200"
                @click="toggleDisplayMode"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="displayMode === 'tree'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  <path v-else
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>{{ displayMode === 'tree' ? '列表视图' : '树状视图' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 可滚动的书签列表容器 -->
        <div class="flex-1 min-h-0">
          <div class="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-md">
            <div class="px-4 py-2">
              <BookmarkTree
                :bookmarks="bookmarks"
                :filter="searchQuery"
                :display-mode="displayMode"
                @edit="handleEdit"
                @delete="handleDelete"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
