## 1. 標籤與陰影

- [x] 1.1 依 **Animate the bullet menu** 調整標籤：`src/radial-menu.ts` 移除 `cancelHint` 選項與其預設文字，標籤初始為空、無高亮時清空並加上隱藏用的 class，有高亮時顯示該指令名稱並移除該 class；驗證：`tests/radial-menu.test.ts` 改為斷言初始與回到中央時標籤為空、指向某格時顯示名稱。
- [x] 1.2 加強陰影：`styles.css` 讓圖示按鈕與中央取消鍵使用較明顯的自訂陰影，高亮時陰影加深，並保留減少動態時停用過場的規則；驗證：`tests/mobile-compatibility.test.ts` 斷言按鈕規則含 box-shadow 且高亮規則亦含 box-shadow。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `1.14.1`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：build 成功且 bundle 不再含取消提示字串。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.14.1`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機視覺由使用者驗收。
