## 1. 修正

- [x] 1.1 實作 **Render outline rows in a compact indent-first style** 修正：`styles.css` 編號規則回復 0.1.38 原樣（inline-flex、min-width 24px、muted、tabular-nums），刪除 is-dot 樣式；`src/outline-sidebar-view.ts` 葉節點佔位回復為無字元 spacer；預覽按鈕改為放大鏡 SVG（無「…」文字）；驗證：`tests/outline-sidebar-view.test.ts` 改斷言 spacer 文字為空、預覽按鈕含 svg 且無文字。
- [x] 1.2 實作 **Show the full breadcrumb trail on mobile** 修正：`styles.css` 移除 `.is-mobile .bullet-zoom-breadcrumb` 的 6.5em max-width 與 label 截斷規則，保留分隔符號與面板 overflow-x auto；驗證：`tests/mobile-compatibility.test.ts` 斷言 ancestor 無 6.5em max-width、面板 overflowX 為 auto。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`，同步修正受影響測試；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.40`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含放大鏡圖示、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.40`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機排版由使用者驗收。
