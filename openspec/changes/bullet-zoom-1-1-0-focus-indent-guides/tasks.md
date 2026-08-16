## 1. 引導線

- [x] 1.1 實作 **Draw indent guides on the focus page** 的樣式：`styles.css` 新增以 `.bullet-zoom-indent-guides` 為前綴的規則，對 `.bullet-zoom-rebased-line` 設定 `background-image: repeating-linear-gradient(...)`（週期為 `--bullet-zoom-indent-unit`、線寬 1px、色票 `--background-modifier-border`）、`background-size: calc(var(--bullet-zoom-relative-depth, 0) * var(--bullet-zoom-indent-unit, 1.2em)) 100%`、`background-repeat: no-repeat`，並以 `background-position` 對齊祖先 Bullet 標記；不得改變 padding、text-indent 或觸控區域；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言規則存在、選擇器含引導線 class、背景寬度引用深度與縮排單位變數。
- [x] 1.2 接上設定：`src/settings.ts` 新增 `focusIndentGuides`（布林、預設 true、非布林回退預設）；`src/main.ts` 在 `Focus page` 區塊加入 `Indent guides` toggle（說明 `Show vertical lines that connect nested bullets.`），並在套用設定時依值在 `document.body` 加上或移除 `bullet-zoom-indent-guides` class，`onunload` 一併移除；驗證：`tests/settings.test.ts` 斷言預設值與正規化，並斷言更新設定後 body class 的加入與移除、`onunload` 後不殘留。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 的 Focus page 設定說明加入 Indent guides；同步四個版本檔為 `1.1.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含引導線 class 切換、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.1.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機引導線視覺由使用者驗收。
