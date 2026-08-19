## 1. 祖先導覽

- [x] 1.1 依 **Reach an ancestor bullet without zooming** 新增查找：`src/list-structure.ts` 的 `findAncestorBullet` 以縮排欄位往上找，支援一路到頂與不越過指定位置，遇標題停止；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的三個 Example。
- [x] 1.2 依 **Reach an ancestor bullet without zooming** 接上指令：`src/focus-extension.ts` 讓 `Go to parent bullet` 在沒有 Zoom 時移動游標，並新增 `Go to top-level bullet`；`src/command-definitions.ts` 與 `src/main.ts` 註冊，`src/settings.ts` 讓第八格預設放新指令；驗證：`tests/focus-extension.test.ts` 覆蓋游標移動與說明訊息。

- [x] 1.3 依 **Fail parent navigation safely** 更新失敗路徑：沒有祖先時保持文件與選取不變並說明原因，取不到編輯器時維持既有訊息；驗證：`tests/focus-extension.test.ts` 覆蓋兩種失敗情境。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 的指令與導覽章節；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.24.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
