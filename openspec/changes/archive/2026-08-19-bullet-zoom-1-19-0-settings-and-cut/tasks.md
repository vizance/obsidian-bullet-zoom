## 1. 設定頁重整

- [x] 1.1 依 **Present an English interface grouped into settings sections** 重編分區：`src/main.ts` 改為六段附說明的標題，把選項移到相符的段落；驗證：`npm run build` 通過、實機檢視。
- [x] 1.2 依 **Present an English interface grouped into settings sections** 補上缺少的入口：`src/main.ts` 新增複製範圍與前綴文字控制項；驗證：改值後 `data.json` 反映設定。
- [x] 1.3 依 **Edit menu slots in a compact list** 重做插槽列：`src/main.ts` 以外掛自有 DOM 呈現編號、預覽、指令、圖示欄與開關；`styles.css` 加上單行版面規則；驗證：`tests/mobile-compatibility.test.ts` 覆蓋樣式表 Example。

## 2. 剪下指令

- [x] 2.1 依 **Cut a bullet with its children** 新增 `cut-bullet` 指令：`src/main.ts` 先複製整段分支、成功後才移除，失敗時保留內容並提示；驗證：`npm run build` 通過、實機驗收。
- [x] 2.2 依 **Cut a bullet with its children** 讓剪下可放進選單：`src/settings.ts` 預設插槽補上剪下；驗證：`tests/settings.test.ts` 的預設插槽斷言更新後通過。

## 3. 文件與發布

- [x] 3.1 更新 `README.md` 與 `README.zh-TW.md` 的設定與指令章節；驗證：兩份說明一致。
- [x] 3.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 3.3 同步四個版本檔為 `1.19.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
