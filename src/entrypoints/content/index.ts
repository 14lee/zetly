import { browser } from "wxt/browser";
import { type ContentScriptContext } from "wxt/client";
import App from "./App.vue";
import { createApp } from "vue";

import '@/assets/tailwind.css';

interface ToggleMessage {
  type: 'TOGGLE_UI';
}

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext) {
    let ui: Awaited<ReturnType<typeof defineOverlay>> | undefined;

    // 监听自定义关闭事件
    window.addEventListener('close-overlay', () => {
      if (ui) {
        ui.remove();
        ui = undefined;
      }
    });

    // 监听扩展命令
    browser.runtime.onMessage.addListener((
      message: unknown,
      _sender: any,
      sendResponse: (response?: any) => void
    ): true | undefined => {
      const toggleMessage = message as ToggleMessage;
      if (toggleMessage.type === 'TOGGLE_UI') {
        if (!ui) {
          defineOverlay(ctx).then(overlay => {
            ui = overlay;
            ui.mount();
            sendResponse({ success: true });
          });
        } else {
          ui.remove();
          ui = undefined;
          sendResponse({ success: true });
        }
        return true; // 表示会异步处理
      }
      return undefined; // 不处理其他消息
    });
  },
});

function defineOverlay(ctx: ContentScriptContext) {
  return createShadowRootUi(ctx, {
    name: "vue-overlay",
    position: "modal",
    zIndex: 99999,
    onMount(container: HTMLElement, _shadow: ShadowRoot, shadowHost: HTMLElement) {
      const app = createApp(App);
      app.mount(container);
      shadowHost.style.pointerEvents = "none";
      return app;
    },
    onRemove(app) {
      app?.unmount();
    },
  });
}
