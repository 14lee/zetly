import { browser } from 'wxt/browser';

interface Message {
  type: 'GET_BOOKMARKS' | 'UPDATE_BOOKMARK' | 'DELETE_BOOKMARK' | 'OPEN_TAB';
  bookmark?: {
    id: string;
    title?: string;
    url?: string;
  };
  url?: string;
}

interface ResponseData {
  success: boolean;
  data?: any[];
  error?: string;
}

export default defineBackground({
  main() {
    // 监听来自 content script 的消息
    browser.runtime.onMessage.addListener((
      message: unknown,
      _,
      sendResponse: (response: ResponseData) => void
    ) => {
      (async () => {
        try {
          const msg = message as Message;
          switch (msg.type) {
            case 'GET_BOOKMARKS':
              const tree = await browser.bookmarks.getTree();
              sendResponse({ success: true, data: tree[0].children });
              break;

            case 'UPDATE_BOOKMARK':
              if (msg.bookmark) {
                await browser.bookmarks.update(msg.bookmark.id, {
                  title: msg.bookmark.title,
                  url: msg.bookmark.url
                });
                const updatedTree = await browser.bookmarks.getTree();
                sendResponse({ success: true, data: updatedTree[0].children });
              } else {
                sendResponse({ success: false, error: 'No bookmark data provided' });
              }
              break;

            case 'DELETE_BOOKMARK':
              if (msg.bookmark) {
                await browser.bookmarks.remove(msg.bookmark.id);
                const newTree = await browser.bookmarks.getTree();
                sendResponse({ success: true, data: newTree[0].children });
              } else {
                sendResponse({ success: false, error: 'No bookmark data provided' });
              }
              break;

            case 'OPEN_TAB':
              if (msg.url) {
                await browser.tabs.create({ url: msg.url });
                sendResponse({ success: true });
              } else {
                sendResponse({ success: false, error: 'No URL provided' });
              }
              break;

            default:
              sendResponse({ success: false, error: 'Unknown message type' });
          }
        } catch (error: any) {
          console.error('Error in background script:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // 表示会异步发送响应
    });

    // 监听命令
    browser.commands.onCommand.addListener(async (command: string) => {
      if (command === 'activate') {
        // 获取当前标签页
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          // 发送消息到内容脚本
          browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_UI' });
        }
      }
    });
  },
});
