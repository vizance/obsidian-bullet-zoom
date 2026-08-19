## 1. 指令目錄

- [x] 1.1 依 **Resolve command names and icons from the registry** 新增目錄模組：`src/command-catalog.ts` 讀取登錄表並在需要時退回清單查詢，去重、補名稱、容錯；驗證：`tests/command-catalog.test.ts` 覆蓋 spec 的三個 Example。
- [x] 1.2 依 **Resolve command names and icons from the registry** 接上選單與設定：`src/main.ts` 快取最後一份非空目錄，選單與插槽選單都改用它；驗證：`npm run build` 通過、實機確認圖示不再消失。

## 2. 發布

- [x] 2.1 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.2 同步四個版本檔為 `1.23.2`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
