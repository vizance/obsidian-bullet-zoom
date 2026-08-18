## 1. 標籤位置

- [x] 1.1 依 **Animate the bullet menu** 調整標籤定位：`src/radial-menu.ts` 以所有格子座標與中央控制項計算選單外框，標籤預設置於外框上緣減去間距與按鈕半徑，超出可視區域上緣時改置於外框下緣加上同樣距離；水平以外框中心對齊並夾在可視區域左右內縮範圍內；`styles.css` 讓標籤以 `translate(-50%, -100%)` 對齊上方擺放、下方擺放時改用 `translate(-50%, 0)` 的修飾 class；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的「標籤高於所有格子」與「靠近頂端時翻到下方」兩個 Example，並斷言水平位置在可視區域內。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `1.15.1`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：build 成功。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.15.1`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機標籤可讀性由使用者驗收。
