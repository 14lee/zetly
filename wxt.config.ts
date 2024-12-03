import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "zetly",
    commands: {
      activate: {
        suggested_key: {
          default: "Alt+C"
        },
        description: "Activate the extension"
      }
    },
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      96: "/icon/96.png",
      128: "/icon/128.png"
    },
    permissions: ["bookmarks", "activeTab"],
    host_permissions: ["*://*/*"]
  },
  modules: ["@wxt-dev/module-vue"],
});
