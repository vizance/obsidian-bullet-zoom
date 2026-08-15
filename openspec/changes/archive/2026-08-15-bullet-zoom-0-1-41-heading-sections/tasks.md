## 1. 標題分區

- [x] 1.1 實作標題掃描：`src/list-structure.ts` 新增 `buildOutlineHeadings(state)`，逐行解析 ATX 標題（1–6 級）、略過 frontmatter 與 fenced code block，回傳凍結的（level、label、from）清單；驗證：`tests/list-structure.test.ts` 覆蓋兩個標題、無標題、frontmatter 內 `#`、code fence 內 `#` 四種情境。
- [x] 1.2 實作 **Group the outline into heading sections** 的渲染：大綱 model 增加 `headings` 欄位（coordinator 於 refresh 時以目前文件計算）；`renderOutlineSidebar` 把頂層節點依 anchor 位置分組到最近的前一個標題，為每組建立不可點擊的標頭列（div、非 button、不進 Tab 順序、class 帶 is-level-N）與獨立的節點清單，頂層編號每組從 1 起算；`styles.css` 為標頭列加上與 Bullet 列區隔的樣式（小字級、muted、上方留白）；驗證：`tests/outline-sidebar-view.test.ts` 斷言兩區編號皆從 `1.` 起、標頭列非 button、無標題筆記渲染與現狀相同、空區標題仍顯示。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`，同步修正受影響測試；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.41`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含標頭分區邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.41`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機分區顯示由使用者驗收。
