## 1. 可搜尋的指令選擇

- [x] 1.1 依 **Edit menu slots in a compact list** 新增過濾：`src/command-catalog.ts` 的 `filterCommandEntries` 以空白分隔詞比對名稱與 ID、名稱開頭優先、限制筆數；驗證：`tests/command-catalog.test.ts` 覆蓋 spec 的三個 Example。
- [x] 1.2 依 **Edit menu slots in a compact list** 換掉下拉選單：`src/main.ts` 的插槽指令改為按鈕加選擇視窗，含留空選項與名稱顯示；`styles.css` 補上按鈕與清單樣式；驗證：`tests/mobile-compatibility.test.ts` 的版面契約更新後通過。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.25.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
