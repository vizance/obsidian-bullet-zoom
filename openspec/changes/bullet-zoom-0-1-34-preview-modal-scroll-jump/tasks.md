## 1. Modal 關閉行為修正

- [x] 1.1 實作 **Keep the outline scroll position stable across the label preview modal** 的焦點部分：`src/outline-sidebar-view.ts` 的 `BulletLabelPreviewModal` 移除 `onClose` 的 `trigger.focus({ preventScroll: true })`（「…」按鈕僅手機版渲染，桌面無此按鈕）；驗證：`tests/outline-sidebar-view.test.ts` 斷言關閉後 activeElement 不是「…」按鈕，桌面渲染不含 preview 按鈕的既有測試維持通過。
- [x] 1.2 實作 scrollTop 還原：在 `onPreview` 開啟 Modal 前記錄 `.bullet-zoom-outline-sidebar-body` 的 scrollTop，Modal 關閉後的重繪完成時還原該值（沿用現有 `retainedReadyScrollTop` 機制或等價路徑）；驗證：`tests/outline-sidebar-view.test.ts` 模擬 body 捲到 120px、開關 Modal 並觸發重繪，斷言 scrollTop 仍為 120。

## 2. revealCurrent 脈絡穩定

- [x] 2.1 讓 Modal 開關週期不改變 `revealCurrent` 判定：確保 Modal 開啟與關閉引發的 layout-change 重繪中 `lastRenderedContext` 與 renderContext 一致（必要時在 Modal 生命週期內鎖定脈絡），僅筆記身分或 Zoom anchor 實際改變時才為 true；驗證：`tests/outline-sidebar-view.test.ts` 斷言 Modal 週期重繪的 model.revealCurrent 為 false、切換 Zoom anchor 後重繪為 true。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 3. 版本與發布

- [x] 3.1 同步 `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 為 `0.1.34`，更新 `tests/mobile-compatibility.test.ts` 的版本斷言，並在 `README.md` 版本紀錄補 0.1.34 說明；驗證：版本值一致、`npm test` 通過。
- [x] 3.2 `npm run build` 產生 0.1.34 的 `main.js`；驗證：bundle 含新關閉行為、無 Node.js 或 Electron runtime import。
- [ ] 3.3 commit 並推送 main，執行 release guard preflight（`--repo .` `--version 0.1.34`），通過後建 tag `0.1.34` 與 GitHub Release 附 `main.js`、`manifest.json`、`styles.css`；驗證：Release 資產齊全、BRAT 可偵測更新；實體 iPhone 驗收由使用者確認。
