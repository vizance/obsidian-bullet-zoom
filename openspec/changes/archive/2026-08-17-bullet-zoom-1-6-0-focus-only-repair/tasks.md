## 1. 移除非聚焦整理

- [x] 1.1 移除 **Tidy dictated lines inside lists without zooming** 的規劃器：`src/list-structure.ts` 刪除 `planEditedListRepair` 與僅供它使用的輔助程式碼；`tests/list-structure.test.ts` 刪除 `edited list repair without focus` 測試群組；驗證：`npm run build` 無未使用匯出錯誤、`npx vitest run tests/list-structure.test.ts` 通過。
- [x] 1.2 讓 **Keep stray lines visible and repair them automatically** 回到僅聚焦時觸發：`src/focus-extension.ts` 的修復 plugin 移除 `pendingFrom`／`pendingTo` 累積邏輯與 `planEditedListRepair` 匯入，`update` 在沒有聚焦 session 時取消排程，`repair` 僅在有 session 時執行；驗證：`tests/focus-extension.test.ts` 刪除未聚焦整理的兩個測試，新增斷言「未聚焦時計時器推進後文件不變」。
- [x] 1.3 還原設定說明：`src/main.ts` 的 `Fix broken bullets` 說明改回只描述聚焦情境（`While zoomed, tidy dictated lines into bullets under the item above them.`）；驗證：`npm run build` 通過且設定測試不變。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 移除 `README.md` 與 `README.zh-TW.md` 中關於未聚焦整理的段落；同步四個版本檔為 `1.6.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 不再含非聚焦整理邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.6.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機一般清單編輯不再被干擾由使用者驗收。
