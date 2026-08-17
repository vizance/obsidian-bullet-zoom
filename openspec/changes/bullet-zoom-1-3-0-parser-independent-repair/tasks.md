## 1. 不依賴解析的修復

- [x] 1.1 實作 **Keep stray lines visible and repair them automatically** 的新規劃器：`src/list-structure.ts` 以 `planFocusStructureRepair(state, anchor, visibleTo)` 取代 `planStrayLineRepair`，工作區間為聚焦 Bullet 行之後到 `visibleTo` 所在行，行分類只用 `ANY_LIST_MARKER_PATTERN` 與 `countColumn` 計算縮排欄數；空行保留、縮排深於聚焦 Bullet 的清單項目不動、縮排不深的清單項目重新縮排到子層、其餘非空行加上子層縮排與 `- `；遇程式碼圍欄停止；無變更回傳 null；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的五個 Example。
- [x] 1.2 接上觸發：`src/focus-extension.ts` 的 `StrayLineRepairPlugin` 改呼叫 `planFocusStructureRepair(state, session.anchor, session.visibleTo)`，其餘 debounce、`isolateHistory` 與設定行為不變；移除已不使用的 `planStrayLineRepair` 匯入；驗證：`tests/focus-extension.test.ts` 斷言口述多段內容在計時器推進後全部成為子 Bullet、可單獨 Undo、關閉設定時不改文件。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過且無殘留未使用匯出。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明「每個換行成為下一個 Bullet」的修復行為；同步四個版本檔為 `1.3.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含新規劃器、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.3.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機 Typeless 口述流程由使用者驗收。
