## 1. 聚焦頁重定基準

- [x] 1.1 實作 **Rebase focus page layout to the focused bullet** 的標題部分：`styles.css` 為 `.bullet-zoom-focus-root-line` 加上 `text-indent: 0 !important` 與 `padding-inline-start: 0 !important`，並在 `.is-phone`（或既有手機 class）下把標題字級改為 `clamp(1.3em, 6vw, 1.8em)`；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言根行 computed text-indent 為 0px、padding-inline-start 為 0px。
- [x] 1.2 實作子項目重定基準：`src/focus-extension.ts` 的 `focusPageDecorations` 對聚焦分支內（不含根行）的每個 Bullet 行加入 (1) `Decoration.replace` 隱藏行首縮排字元、(2) `Decoration.line` 寫入 class `bullet-zoom-rebased-line` 與 style 變數 `--bullet-zoom-relative-depth`（依分支內行首縮排寬度映射層級，上限 8）；驗證：`tests/focus-extension.test.ts` 用五層文件聚焦第三層，斷言子行帶 rebased class、變數值分別為 1 與 2，退出聚焦後 DOM 無 rebased class。
- [x] 1.3 在 `styles.css` 為 `.bullet-zoom-rebased-line` 依 `--bullet-zoom-relative-depth` 重建懸掛縮排：`padding-inline-start: calc((var(--bullet-zoom-relative-depth) + 1) * var(--bullet-zoom-indent-unit, 1.2em)) !important`、`text-indent: calc(-1 * var(--bullet-zoom-indent-unit, 1.2em)) !important`；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言規則存在且帶 !important。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.36`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 rebased class 邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.36`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全、BRAT 可更新；實體 iPhone 一畫面閱讀驗收由使用者確認。
