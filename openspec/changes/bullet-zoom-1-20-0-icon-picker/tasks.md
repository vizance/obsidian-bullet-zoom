## 1. 圖示選擇器

- [x] 1.1 依 **Choose the icon for each menu slot** 新增過濾模組：`src/icon-picker.ts` 提供 `filterIconIds` 與 `iconLabel`；驗證：`tests/icon-picker.test.ts` 覆蓋 spec 的四個 Example。
- [x] 1.2 依 **Choose the icon for each menu slot** 加入選擇視窗：`src/main.ts` 新增圖示選擇 Modal，插槽預覽改成按鈕並在選定後同步欄位、預覽與設定；`styles.css` 加上網格樣式；驗證：`tests/mobile-compatibility.test.ts` 覆蓋樣式表 Example、`npm run build` 通過。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.20.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
