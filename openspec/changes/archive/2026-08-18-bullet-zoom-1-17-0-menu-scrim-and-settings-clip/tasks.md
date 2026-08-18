## 1. 遮罩與標示環

- [x] 1.1 實作 **Separate the bullet menu from the note behind it**：`src/radial-menu.ts` 於覆蓋層內新增標示環元素並定位在選單圓心；`styles.css` 讓覆蓋層背景使用 `var(--background-modifier-cover)`、加上 `backdrop-filter: blur(2px)` 與淡入動畫，標示環為半透明圓環，並在既有的減少動態區塊中一併停用覆蓋層淡入；驗證：`tests/radial-menu.test.ts` 斷言標示環存在且定位於圓心、關閉後隨覆蓋層移除，`tests/mobile-compatibility.test.ts` 斷言覆蓋層規則含模態遮罩變數與 backdrop-filter，且減少動態區塊含覆蓋層。
- [x] 1.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 設定頁溢出

- [x] 2.1 實作 **Clip the plugin settings to the panel**：`src/main.ts` 於 `display()` 為 `containerEl` 加上 `bullet-zoom-settings` class；`styles.css` 讓該 class 的 `overflow-x` 為 hidden、`max-width` 為 100%；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言該規則存在且兩項屬性正確。
- [x] 2.2 執行 `npm test` 與 `npm run build`；驗證：全數通過。

## 3. 版本與發布

- [x] 3.1 同步四個版本檔為 `1.17.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 3.2 `npm run build` 產生 `main.js`；驗證：build 成功。
- [x] 3.3 commit 推送 main，release guard preflight（`--version 1.17.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機遮罩效果與設定頁寬度由使用者驗收。
