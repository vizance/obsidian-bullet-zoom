## 1. 模板套用

- [x] 1.1 實作 **Apply a template when extracting a note** 的渲染層：新增 `src/extract-template.ts` 匯出 `renderExtractTemplate(template, { content, title, date, time, source })`，以不分大小寫、容許內部空白的規則替換五個佔位符，無 content 佔位符時內容接在模板後並以空行分隔，模板為空時回傳原內容，未知佔位符保留原樣；驗證：`tests/extract-template.test.ts` 覆蓋 spec 的三個 Example 與未知佔位符、大小寫與空白變體。
- [x] 1.2 實作模板檔清單與設定：`src/folder-suggest.ts` 新增 `collectMarkdownPaths(vault)`（取 `.md` 檔路徑、去重、排序）；`src/settings.ts` 新增 `extractTemplatePath`（字串正規化、去首尾空白與前置斜線，預設空）；驗證：`tests/folder-suggest.test.ts` 斷言只取 `.md` 且排序，`tests/settings.test.ts` 斷言預設值與正規化。
- [x] 1.3 接上設定頁與拆分流程：`src/main.ts` 把資料夾欄的自動完成互動抽成可重用的建立函式，新增「拆分筆記模板」欄位（吃 `collectMarkdownPaths`）；拆分時若模板路徑非空則以 `vault.read` 讀取（找不到或讀取失敗顯示 Notice 並中止、不建立檔案），以 `renderExtractTemplate` 產生內容後才 `vault.create`；`{{date}}`／`{{time}}` 用本地時間、`{{source}}` 用來源筆記 basename 的 wiki 連結；驗證：`npm run build` 無型別錯誤且 `npm test` 通過。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.47`、更新版本斷言、`README.md` 補版本紀錄與模板佔位符說明；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含模板渲染、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.47`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機模板套用由使用者驗收。
