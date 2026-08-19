## 1. 貼上整形

- [x] 1.1 依 **Match the list you paste into** 新增規劃函式：`src/list-structure.ts` 的 `planListPaste` 依目標行縮排與標記樣式重寫分支，含空項目填滿與非清單行沿用；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的五個 Example。
- [x] 1.2 依 **Match the list you paste into** 接上編輯器：`src/main.ts` 監聽貼上事件，在有規劃時取代預設貼上；`src/settings.ts` 新增預設開啟的開關並在設定頁提供控制項；驗證：`tests/settings.test.ts` 覆蓋預設值與正規化。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.21.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
