## 1. 還原被吞掉的標題

- [x] 1.1 依 **Keep stray lines visible and repair them automatically** 處理清單裡的標題：`src/list-structure.ts` 的 `planFocusStructureRepair` 在最外層清單項目內容是標題時去掉標記並停手，巢狀時原樣保留並停手；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的兩個 Example。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [ ] 2.2 同步四個版本檔為 `1.22.2`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
