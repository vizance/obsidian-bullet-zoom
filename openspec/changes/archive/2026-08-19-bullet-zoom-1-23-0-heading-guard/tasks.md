## 1. 編輯層守門

- [x] 1.1 依 **Keep headings out of bullets while typing** 新增守門模組：`src/heading-unwrap.ts` 提供規劃函式與交易過濾器，只檢查被改動的行、只處理沒有縮排的行、不重入自己的修正；驗證：`tests/heading-unwrap.test.ts` 覆蓋 spec 的四個 Example。
- [x] 1.2 依 **Keep headings out of bullets while typing** 接上外掛：`src/main.ts` 註冊守門並新增 `Editing` 區塊，`src/settings.ts` 新增預設開啟的設定；驗證：`tests/settings.test.ts` 覆蓋預設值與正規化。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.23.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
