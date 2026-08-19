## 1. 桌面版選單

- [x] 1.1 依 **Offer the bullet menu on desktop as an opt-in** 開放滑鼠路徑：`src/focus-extension.ts` 的選單設定新增 `allowMouse`，圓點處理器只在允許時接受滑鼠；驗證：`tests/focus-extension.test.ts` 覆蓋 spec 的兩個 Example。
- [x] 1.2 依 **Offer the bullet menu on desktop as an opt-in** 接上設定：`src/settings.ts` 新增預設關閉的 `desktopMenuEnabled`，`src/main.ts` 在桌面依設定註冊選單並在設定頁提供控制項；驗證：`tests/settings.test.ts` 覆蓋預設值與正規化。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.27.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
