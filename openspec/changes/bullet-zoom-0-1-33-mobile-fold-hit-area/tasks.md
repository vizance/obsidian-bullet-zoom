## 1. 手機模式 class 與樣式限縮

- [x] 1.1 在 `src/focus-extension.ts` 的面板呈現外掛（現有 `FocusedPanePresentationPlugin` 或同層機制）中，於 `focusPhoneMode` 為真時替 `.markdown-source-view` 面板加上 `bullet-zoom-phone-pane` class、非手機模式與 destroy 時移除；驗證：`tests/mobile-compatibility.test.ts` 斷言手機模式下面板含該 class、桌面模式下不含。
- [x] 1.2 實作 **Confine the native fold hit area on phones**：在 `styles.css` 新增一律以 `.bullet-zoom-phone-pane` 為前綴的規則，把清單行（`.HyperMD-list-line`）內 `.collapse-indicator` 的可點擊範圍限縮到摺疊圖示本身的緊湊區塊（限制 width／padding／點擊延伸，不使用 `pointer-events: none`，摺疊仍可點）；不得選到 Heading 的摺疊控制；驗證：`tests/mobile-compatibility.test.ts` 以 CSS 契約斷言檢查所有新規則都帶前綴且僅針對清單行。

## 2. 行為驗證

- [x] 2.1 在 `tests/mobile-compatibility.test.ts` 補迴歸測試：手機模式下模擬點擊縮排三層、帶子項目 Bullet 的 marker，斷言觸發 Zoom（focus anchor 轉移）且 fold 狀態未切換；並斷言點擊 `.collapse-indicator` 時外掛讓路（不觸發 Zoom、focus anchor 不變），摺疊行為仍歸原生所有。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build`；驗證：三者全數通過且 `git diff --check` 無空白錯誤。

## 3. 版本與發布

- [x] 3.1 把 `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 的版本同步為 `0.1.33`，並在 `README.md` 的版本紀錄補上 0.1.33 的行為說明（手機摺疊觸控範圍限縮）；驗證：四個檔案版本值一致且 README 描述與 proposal 相符。
- [x] 3.2 以 `npm run build` 產生對應 0.1.33 的 `main.js`；驗證：bundle 內含手機模式 class 邏輯，且未引入 Node.js 或 Electron 專屬 runtime import。
- [ ] 3.3 走官方發布流程：commit 後執行 release guard preflight（`--repo` 指向 origin 為 `github.com/vizance/obsidian-bullet-zoom` 的本 repo、`--version 0.1.33`），通過後建立 tag `0.1.33` 與 GitHub Release 並附上 `main.js`、`manifest.json`、`styles.css`；驗證：Release 資產齊全、BRAT 可偵測到 0.1.33 更新；實體 iPhone 點擊驗收留給使用者確認，不得自行宣稱完成。
