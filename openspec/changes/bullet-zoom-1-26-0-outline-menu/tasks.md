## 1. 大綱列開選單

- [x] 1.1 依 **Open the bullet menu from an outline row** 讓編號可點：`src/outline-sidebar-view.ts` 在設定開啟時把編號渲染成按鈕、加上無障礙名稱與座標，並在座標器新增 `openMenu` 檢查 revision；驗證：`tests/outline-sidebar-view.test.ts` 覆蓋 spec 的兩個 Example 與文字仍 Zoom。
- [x] 1.2 依 **Open the bullet menu from an outline row** 接上外掛與設定：`src/settings.ts` 新增預設開啟的 `outlineMenuEnabled`，`src/main.ts` 提供開關判斷與開選單的實作並在設定頁加入控制項，`styles.css` 補上按鈕樣式；驗證：`tests/settings.test.ts` 覆蓋預設值與正規化。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.26.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
