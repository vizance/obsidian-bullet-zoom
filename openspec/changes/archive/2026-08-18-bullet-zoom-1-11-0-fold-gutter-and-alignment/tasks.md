## 1. 摺疊區與對齊

- [x] 1.1 實作 **Fold from the whole gutter left of the marker** 的摺疊規劃：`src/focus-extension.ts` 新增 `planFoldToggle(state, position)`，以 `foldable` 判斷該行是否可摺疊、以 `foldedRanges` 判斷目前是否已收合，回傳 `'fold' | 'unfold' | null` 與對應範圍；驗證：`tests/focus-extension.test.ts` 覆蓋可摺疊行的首次與再次按下、以及葉節點回傳 null。
- [x] 1.2 接上指標判定：`MarkerPointerPlugin` 的 `pointerdown` 在判定為摺疊區時呼叫 `planFoldToggle`，有結果才 dispatch 對應的 `foldEffect` 或 `unfoldEffect`、`preventDefault`、`stopPropagation` 並抑制隨後的 click；無結果時完全不介入；圓點區與內容區行為不變；驗證：`tests/focus-extension.test.ts` 斷言深層縮排最左側按下會摺疊該行、再按一次展開、葉節點的左側按下不被攔截且不改變狀態。
- [x] 1.3 還原對齊：`styles.css` 移除所有針對 `.collapse-indicator` 的規則；驗證：`tests/mobile-compatibility.test.ts` 的契約改為斷言外掛樣式表沒有任何選擇器提及該原生控制項。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明摺疊區涵蓋圓點左側整片區域；同步四個版本檔為 `1.11.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含摺疊切換、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.11.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機摺疊範圍與對齊由使用者驗收。
