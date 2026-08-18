## 1. 設定列排版

- [x] 1.1 依 **Keep plugin settings within the panel width** 調整樣式：`styles.css` 把控制項容器改為 `flex-wrap: nowrap` 並加上間距，下拉選單設為可收縮並填滿剩餘寬度（`flex: 1 1 auto; min-width: 0`），開關不收縮；名稱欄加上最小寬度與允許收縮；新增窄畫面的 media query 讓外掛設定列改為上下排列、控制項靠左；保留設定容器的水平溢出裁切；驗證：`tests/mobile-compatibility.test.ts` 覆蓋 spec 的四個 Example（最大寬度、名稱最小寬度、控制項不換行、窄畫面堆疊）。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `1.17.1`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：build 成功。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.17.1`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機設定頁排版由使用者驗收。
