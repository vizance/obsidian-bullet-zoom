## 1. 顯示安全網與自動修復

- [x] 1.1 實作 **Keep stray lines visible and repair them automatically** 的掃描與規劃：`src/list-structure.ts` 新增 `scanStrayRange(state, anchor)`（自分支結尾往下掃，遇到縮排不深於聚焦 Bullet 的合法清單項目、`#` 標題或程式碼圍欄即停，排除尾端空行，無脫隊行回傳 null）與 `planStrayLineRepair(state, anchor)`（純文字行補 `- ` 並套用子層縮排、已有標記的行僅重算縮排、脫隊區塊以最小共同縮排保留相對層級、空行保留、無脫隊行回傳 null）；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的四個 Example 與程式碼圍欄、標題停止條件。
- [x] 1.2 接上顯示與觸發：`src/focus-extension.ts` 的 `focusDecorations` 以「分支結尾與 `scanStrayRange` 結尾的較大值」計算遮罩下界，讓脫隊行可見且不加任何標示；新增 `focusAutoFix` facet 與一個 ViewPlugin，在聚焦中且 `docChanged` 時以 600 毫秒 debounce 排程，逾時後套用 `planStrayLineRepair`，以 `isolateHistory` 註記送出獨立 undo 步驟，plugin destroy 時清除計時器；驗證：`tests/focus-extension.test.ts` 斷言脫隊行不被 hidden 裝飾覆蓋、修復後文件符合預期且可單獨 Undo、無脫隊行時不產生交易。
- [x] 1.3 接上設定：`src/settings.ts` 新增 `autoFixStrayLines`（布林、預設 true、非布林回退預設）；`src/main.ts` 於 `Focus page` 區塊加入 `Fix broken bullets` toggle（說明 `While zoomed, indent stray lines back into the focused bullet.`），把值注入 `focusAutoFix` facet，並在該設定變更時重建 editor extensions；驗證：`tests/settings.test.ts` 斷言預設值與正規化。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明聚焦頁的自動修復行為與設定；同步四個版本檔為 `1.2.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含掃描與修復邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.2.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機語音轉文字流程由使用者驗收。
