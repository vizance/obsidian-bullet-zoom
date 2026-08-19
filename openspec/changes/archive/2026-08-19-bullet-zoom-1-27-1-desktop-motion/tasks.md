## 1. 桌面的動態表現

- [x] 1.1 依 **Animate the bullet menu** 新增瞬間模式：`src/radial-menu.ts` 接受 `instant` 並在覆蓋層加上類別，`src/main.ts` 在非行動裝置開啟時送出，`styles.css` 移除該模式的模糊與進場動畫；驗證：`tests/radial-menu.test.ts` 與 `tests/mobile-compatibility.test.ts` 覆蓋 spec 的三個 Example。

## 2. 文件與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 2.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.3 同步四個版本檔為 `1.27.1`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
