## 1. 自動完成

- [x] 1.1 實作 **Autocomplete the extract destination folder** 的邏輯層：新增 `src/folder-suggest.ts`，匯出 `FOLDER_SUGGESTION_LIMIT`（8）、`collectFolderPaths(vault)`（讀 `getAllLoadedFiles()`，取有 `children` 的資料夾物件、排除 root 空路徑、去重後字典序排序）與 `filterFolderSuggestions(paths, query, limit)`（不分大小寫子字串比對、前綴優先、空查詢回前 limit 筆）；驗證：`tests/folder-suggest.test.ts` 覆蓋 spec 的 prefix ordering、bounded list 與空查詢三個 Example。
- [x] 1.2 接上設定頁 UI：`src/main.ts` 的資料夾設定欄改用自訂建議清單——輸入或聚焦時以 `filterFolderSuggestions` 渲染 `bullet-zoom-folder-suggestion` 項目，點擊填入並 `updateSettings`；ArrowDown／ArrowUp 切換 `is-active`、Enter 套用、Escape 關閉、blur 延遲關閉；`tests/obsidian-mock.ts` 補 vault `getAllLoadedFiles` 最小 mock；`styles.css` 加建議清單樣式（絕對定位、主題色票、手機 44px 觸控高度）；驗證：`npm test` 通過且 `npm run build` 無型別錯誤。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.46`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含資料夾建議邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.46`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機自動完成操作由使用者驗收。
