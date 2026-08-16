## 1. 英文化與設定分區

- [x] 1.1 實作 **Present an English interface grouped into settings sections** 的核心字串：`src/command-definitions.ts`、`src/focus-extension.ts`、`src/outline-sidebar-view.ts`、`src/list-structure.ts` 內所有面向使用者的文字改為英文，包含指令名稱（`Exit bullet focus`、`Go to parent bullet`）、Notice 常數、麵包屑與大綱面板狀態訊息、全文預覽視窗（標題 `Bullet text`、按鈕 `Close`）、空值顯示（`Untitled bullet`、`Untitled note`）與大綱視圖名稱 `Bullet outline`；驗證：更新 `tests/command-definitions.test.ts`、`tests/focus-extension.test.ts`、`tests/outline-sidebar-view.test.ts`、`tests/list-structure.test.ts` 中對應的文字斷言後 `npm test` 通過。
- [x] 1.2 重寫設定頁：`src/main.ts` 依序建立 `Zoom`、`Outline`、`Focus page`、`Extract to new note` 四個 `setHeading()` 區塊並把既有選項移入對應區塊，所有名稱、說明、佔位文字、tooltip、Notice、拆分視窗（標題 `Extract to new note`、輸入提示 `New note name`、按鈕 `Create`／`Cancel`）改為英文；設定鍵名、預設值與行為不變；驗證：`npm run build` 無型別錯誤且既有設定測試維持通過。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過且原始碼無殘留面向使用者的中文字串（測試檔內的中文測資除外）。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.48`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含英文字串、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.48`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機介面文字與設定分區由使用者驗收。
