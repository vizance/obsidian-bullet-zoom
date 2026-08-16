## 1. 拆分後行為

- [x] 1.1 實作 **Choose what happens after extracting** 的設定層：`src/settings.ts` 新增 `ExtractOpenBehavior` 型別與 `extractOpenBehavior` 欄位（`stay`／`current`／`tab`／`split`，預設 `stay`，未知值正規化為 `stay`）；驗證：`tests/settings.test.ts` 斷言預設值、三個有效值與未知值回退。
- [x] 1.2 接上設定頁與拆分流程：`src/main.ts` 在 `Extract to new note` 區塊加入 `After extracting` 下拉（四個選項文字如 proposal 所列）；拆分完成並替換原文後，依設定以 `workspace.getLeaf` 取得對應 leaf（`current` 用現有分頁、`tab` 用 `'tab'`、`split` 用 `'split'`）並 `openFile` 開啟建立出的檔案，`stay` 則不動作；開啟過程拋錯時顯示 Notice `Could not open the new note.` 且不影響已完成的拆分；驗證：`npm run build` 無型別錯誤且 `npm test` 通過。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.50`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含四種開啟行為、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.50`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機四種行為由使用者驗收。
