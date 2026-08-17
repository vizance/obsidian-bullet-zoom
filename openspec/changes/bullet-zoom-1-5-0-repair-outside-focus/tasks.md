## 1. 非聚焦整理

- [x] 1.1 實作 **Tidy dictated lines inside lists without zooming** 的規劃器：`src/list-structure.ts` 新增 `planEditedListRepair(state, changedFrom, changedTo)`——自變更起始行往上（跳過空行）尋找最近的清單項目作為錨點，遇非清單非空行或找不到即回傳 null；區間為錨點行之後到變更結束行；只轉換無清單標記的非空行（縮排為最近清單項目的下一層、同一批共用同一縮排、文字原樣、補 `- `），既有清單項目原樣保留並更新後續縮排基準；移除位於第一個與最後一個轉換行之間的空行、保留其餘空行；遇程式碼圍欄停止；無任何轉換回傳 null；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的四個 Example 與程式碼圍欄情境。
- [x] 1.2 接上觸發：`src/focus-extension.ts` 的修復 plugin 在 `docChanged` 時累積變更範圍（既有累積值以 `mapPos` 隨新變更移動），debounce 逾時後——有聚焦 session 時沿用 `planFocusStructureRepair`，無 session 時改用累積範圍呼叫 `planEditedListRepair`；送出後清除累積範圍；`isolateHistory` 與設定判斷不變；驗證：`tests/focus-extension.test.ts` 斷言未聚焦時於清單中插入純文字會在計時器推進後整理、於一般段落中插入不會改動文件、關閉設定時不動作。
- [x] 1.3 更新設定說明：`src/main.ts` 的 `Fix broken bullets` 說明改為涵蓋聚焦與一般編輯兩種情境；驗證：`npm run build` 無型別錯誤且既有設定測試通過。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明未聚焦時的整理行為與其保守規則；同步四個版本檔為 `1.5.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含非聚焦整理邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.5.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機一般清單口述流程由使用者驗收。
