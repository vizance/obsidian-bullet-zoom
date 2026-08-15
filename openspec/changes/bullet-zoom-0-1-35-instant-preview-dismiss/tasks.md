## 1. 立即關閉

- [x] 1.1 實作 **Dismiss the label preview modal instantly**：`src/outline-sidebar-view.ts` 的 `BulletLabelPreviewModal.close()` 在既有 `modalEl.hidden = true` 之外，於呼叫 `super.close()` 前把 `containerEl.hidden` 設為 true，沿用 `closing` 防護確保原生 close 只跑一次；驗證：`tests/outline-sidebar-view.test.ts` 斷言關閉後 `modalEl.hidden` 與 `containerEl.hidden` 皆為 true 且原生 close 只被呼叫一次。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步 `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 為 `0.1.35`，更新 `tests/mobile-compatibility.test.ts` 版本斷言，`README.md` 版本紀錄補 0.1.35；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 containerEl 隱藏邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--repo .` `--version 0.1.35`）通過後建 tag 與 GitHub Release 附 `main.js`、`manifest.json`、`styles.css`；驗證：資產齊全、BRAT 可更新；實體 iPhone 驗收由使用者確認。
