## 1. 游標抑制

- [x] 1.1 實作 **Suppress the caret while the bullet menu is open** 的關閉回呼：`src/radial-menu.ts` 的 `openRadialMenu` 新增 `onClose` 選項，於 `close()` 內在移除節點後呼叫一次，確保選取、取消、Escape 與點覆蓋層外都會觸發；驗證：`tests/radial-menu.test.ts` 斷言四種關閉路徑各觸發一次且僅一次。
- [x] 1.2 接上編輯器狀態：`src/main.ts` 開啟選單前記錄 `view.hasFocus`、於 `view.dom` 加上 `bullet-zoom-menu-open` class 並呼叫 `view.contentDOM.blur()`；`onClose` 時移除 class，原本有焦點才呼叫 `view.focus()`；驗證：`npm run build` 無型別錯誤。
- [x] 1.3 加入樣式：`styles.css` 讓 `.bullet-zoom-menu-open .cm-content` 的 `caret-color` 透明、`user-select` 與 `-webkit-user-select` 為 none、`pointer-events` 為 none；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言三項皆存在。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明選單開啟期間游標暫停、關閉後回復；同步四個版本檔為 `1.15.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：build 成功且 bundle 含狀態 class。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.15.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機在鍵盤開啟狀態下的長按由使用者驗收。
