<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed } from 'vue';

interface Bookmark {
  id: string;
  title: string;
  url?: string;
  children?: Bookmark[];
  isOpen?: boolean;
}

const props = defineProps<{
  bookmarks: Bookmark[];
  filter?: string;
  displayMode: 'tree' | 'list';
}>();

const emit = defineEmits<{
  edit: [bookmark: Bookmark];
  delete: [bookmark: Bookmark];
}>();

// 将书签树扁平化为一维数组
const flattenBookmarks = (bookmarks: Bookmark[]): Bookmark[] => {
  const result: Bookmark[] = [];

  const traverse = (items: Bookmark[]) => {
    items.forEach(item => {
      if (item.url) {
        result.push(item);
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  };

  traverse(bookmarks);
  return result;
};

const toggleFolder = (bookmark: Bookmark) => {
  bookmark.isOpen = !bookmark.isOpen;
};

// 判断书签是否匹配搜索条件
const isMatch = (bookmark: Bookmark, searchTerm: string): boolean => {
  if (!searchTerm) return true;

  const term = searchTerm.toLowerCase();

  // 检查标题和 URL
  if (bookmark.title.toLowerCase().includes(term)) return true;
  if (bookmark.url?.toLowerCase().includes(term)) return true;

  // 递归检查子书签
  if (bookmark.children) {
    return bookmark.children.some(child => isMatch(child, term));
  }

  return false;
};

// 过滤并处理��签树
const processBookmarks = (bookmarks: Bookmark[], searchTerm: string): Bookmark[] => {
  if (!searchTerm) return bookmarks;

  return bookmarks
    .map(bookmark => {
      // 如果是文件夹，递归处理子项
      if (bookmark.children) {
        const filteredChildren = processBookmarks(bookmark.children, searchTerm);
        if (filteredChildren.length > 0 || isMatch(bookmark, searchTerm)) {
          return {
            ...bookmark,
            children: filteredChildren,
            isOpen: searchTerm.length > 0 // 搜索时自动展开匹配的文件夹
          };
        }
        return null;
      }

      // 如果是书签，检查是否匹配
      return isMatch(bookmark, searchTerm) ? bookmark : null;
    })
    .filter((bookmark): bookmark is Bookmark => bookmark !== null);
};

// 计算过滤后的书签列表
const filteredBookmarks = computed(() => {
  const processed = processBookmarks(props.bookmarks, props.filter || '');
  return props.displayMode === 'tree' ? processed : flattenBookmarks(processed);
});

// 获取网站图标
const getFavicon = (url?: string) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`;
  } catch {
    return '';
  }
};
</script>

<template>
  <div class="bookmark-tree">
    <template v-if="displayMode === 'tree'">
      <template v-for="bookmark in filteredBookmarks" :key="bookmark.id">
        <div class="bookmark-item">
          <!-- 文件夹 -->
          <div v-if="bookmark.children"
               class="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer group"
               @click="toggleFolder(bookmark)">
            <svg class="w-4 h-4 mr-3 text-gray-500 transform transition-transform"
                 :class="{ 'rotate-90': bookmark.isOpen }"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5l7 7-7 7" />
            </svg>
            <svg class="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900">{{ bookmark.title }}</div>
            </div>
          </div>

          <!-- 书签链接 -->
          <div v-else
               class="flex items-center p-2 hover:bg-gray-100 rounded-lg group ml-4">
            <img :src="getFavicon(bookmark.url)" :alt="bookmark.title" class="w-4 h-4 mr-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ bookmark.title }}</div>
              <div class="text-xs text-gray-500 truncate">{{ bookmark.url }}</div>
            </div>
            <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <button class="p-1 text-gray-500 hover:text-blue-600"
                      @click.stop="emit('edit', bookmark)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="p-1 text-gray-500 hover:text-red-600"
                      @click.stop="emit('delete', bookmark)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 递归渲染子文件夹 -->
          <div v-if="bookmark.children && bookmark.isOpen" class="ml-6">
            <BookmarkTree
              :bookmarks="bookmark.children"
              :filter="filter"
              :display-mode="displayMode"
              @edit="emit('edit', $event)"
              @delete="emit('delete', $event)"
            />
          </div>
        </div>
      </template>
    </template>

    <!-- 列表视图 -->
    <template v-else>
      <div v-for="bookmark in filteredBookmarks" :key="bookmark.id"
           class="flex items-center p-2 hover:bg-gray-100 rounded-lg group">
        <img :src="getFavicon(bookmark.url)" :alt="bookmark.title" class="w-4 h-4 mr-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 truncate">{{ bookmark.title }}</div>
          <div class="text-xs text-gray-500 truncate">{{ bookmark.url }}</div>
        </div>
        <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
          <button class="p-1 text-gray-500 hover:text-blue-600"
                  @click.stop="emit('edit', bookmark)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="p-1 text-gray-500 hover:text-red-600"
                  @click.stop="emit('delete', bookmark)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bookmark-tree {
  @apply space-y-1;
}
</style>
