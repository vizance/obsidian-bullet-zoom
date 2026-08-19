## 1. 檔名清洗

- [x] 1.1 依 **Sanitize the name of an extracted note** 套用清洗：`src/list-structure.ts` 匯出可重用的清洗函式，`src/main.ts` 在拆分前對使用者輸入的名稱套用並在清洗後為空時中止；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的三個 Example。

## 2. 樣式與探針清理

- [x] 2.1 依 **Dismiss the label preview modal instantly** 改用類別：`src/outline-sidebar-view.ts` 加上外掛自有的強制隱藏類別，`styles.css` 宣告 `display: none !important`；驗證：`tests/outline-sidebar-view.test.ts` 改為檢查類別後通過。
- [x] 2.2 剪貼簿退路的暫存 textarea 改用樣式表類別，並刪除只印 log 的探針測試；驗證：`npm run lint` 沒有 error。

## 3. 發布

- [x] 3.1 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 3.2 同步四個版本檔為 `1.25.1`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
