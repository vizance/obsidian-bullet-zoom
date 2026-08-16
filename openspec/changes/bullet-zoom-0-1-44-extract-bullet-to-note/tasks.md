## 1. 拆分功能

- [x] 1.1 實作 **Extract a bullet branch into a new note** 的文件操作層：`src/list-structure.ts` 新增 `planBulletExtract(state, anchor, removeTopBullet)` 回傳 `{ replaceFrom, replaceTo, linkIndentText, fileContent }`（或 null）；removeTop 模式以子行最小共同前綴歸零、無子行退回 label；keep 模式整段分支歸零；驗證：`tests/list-structure.test.ts` 覆蓋 spec 三個 Example 與巢狀來源。
- [x] 1.2 接上設定與指令層：`src/settings.ts` 新增 `extractRemoveTopBullet`（預設 true、布林正規化）；`src/main.ts` 新增設定頁 toggle、檔名輸入 Modal（輸入欄＋確定／取消、Enter 送出）與 editorCheckCallback 指令「拆分 Bullet 成新筆記」——確認後於目前筆記同資料夾 `vault.create('name.md', fileContent)`，成功後把原分支替換為 `縮排- [[name]]`；空檔名或檔案已存在以 Notice 中止且不改原文；`tests/obsidian-mock.ts` 依需要補 vault／TFile 最小 mock；驗證：`tests/settings.test.ts` 斷言預設值與正規化。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.44`、更新版本斷言、`README.md` 補版本紀錄與指令說明；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 planBulletExtract 與指令、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.44`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機拆分流程由使用者驗收。
