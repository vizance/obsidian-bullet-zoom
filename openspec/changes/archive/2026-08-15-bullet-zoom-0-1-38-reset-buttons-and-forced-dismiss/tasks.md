## 1. 修正與新增

- [x] 1.1 實作 **Dismiss the label preview modal instantly** 補強：`src/outline-sidebar-view.ts` 的 `BulletLabelPreviewModal.close()` 以 `style.setProperty('display', 'none', 'important')` 強制隱藏 `modalEl` 與 `containerEl`（保留既有 hidden 與 closing 防護）；驗證：`tests/outline-sidebar-view.test.ts` 斷言關閉後兩元素行內 display 為 none 且 priority 為 important、原生 close 僅一次。
- [x] 1.2 實作 **Reset each size slider to its default with one tap**：`src/main.ts` 的設定頁為兩條滑桿各加 `addExtraButton`（restore 圖示、tooltip「恢復預設 100%」），點擊時呼叫 `updateSettings` 將該值設回 100 並重新執行 `display()`；`tests/obsidian-mock.ts` 補 `ExtraButtonComponent` mock（setIcon／setTooltip／onClick 鏈式 API）；驗證：`tests/settings.test.ts` 斷言重設後值為 100、另一條滑桿值不變、body 變數更新。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.38`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 important display 邏輯與重設按鈕、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.38`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全、BRAT 可更新；實機視窗瞬間消失與重設手感由使用者驗收。
