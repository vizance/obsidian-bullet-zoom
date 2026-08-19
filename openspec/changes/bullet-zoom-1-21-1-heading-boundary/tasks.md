## 1. 修復邊界

- [x] 1.1 依 **Keep stray lines visible and repair them automatically** 讓標題成為邊界：`src/list-structure.ts` 的 `planFocusStructureRepair` 在標題行停下，替換範圍結束於最後一行實際被改寫的內容，邊界前的空行保留；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的兩個標題 Example，既有修復測試維持通過。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 的自動修復段落；驗證：兩份說明一致。
- [ ] 2.2 同步四個版本檔為 `1.21.1`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
