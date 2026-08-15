## 1. 大綱緊湊化與麵包屑完整路徑

- [x] 1.1 實作 **Render outline rows in a compact indent-first style**：`src/outline-sidebar-view.ts` 把葉節點佔位元素加上小圓點內容與 `is-dot` 樣式（保留既有 spacer class 與 aria-hidden）；`styles.css` 讓編號縮小淡化並靠右貼齊（justify-self end、muted 色、smaller 字級）、三角形在欄內靠右貼緊文字、手機每層縮排改 12px（depth-6 為 72px）、列內距收緊但維持 44px 觸控；驗證：`tests/outline-sidebar-view.test.ts` 斷言葉節點 dot 元素存在且 aria-hidden，`tests/mobile-compatibility.test.ts` CSS 契約斷言 depth-6 縮排 72px 與 44px 觸控不變。
- [x] 1.2 實作 **Show the full breadcrumb trail on mobile**：`styles.css` 移除 `.is-mobile` 隱藏 ancestor 麵包屑與分隔符號的規則，改為全部顯示、面板 overflow-x auto、非目前節點 max-width 6.5em 加省略號；驗證：`tests/mobile-compatibility.test.ts` 的 315px 手機導覽測試改斷言 ancestor 可見、分隔符號可見、面板 overflowX 為 auto。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`，修正受影響的既有測試期望；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.39`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 dot 元素邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.39`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全、BRAT 可更新；實機視覺與 Workflowy 對比由使用者驗收。
