## 1. 只修正正在編輯的窗格

- [x] 1.1 依 **Keep stray lines visible and repair them automatically** 加上焦點條件：`src/focus-extension.ts` 在排程與執行前都要求編輯器持有輸入焦點，失去焦點時取消排程；驗證：`tests/focus-extension.test.ts` 覆蓋背景窗格不被修改的 Example，既有修復測試維持通過。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [ ] 2.2 同步四個版本檔為 `1.23.1`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
