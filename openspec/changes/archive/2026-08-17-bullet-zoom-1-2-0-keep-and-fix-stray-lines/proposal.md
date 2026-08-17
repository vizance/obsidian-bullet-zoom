## Problem

在聚焦模式中用語音轉文字或 AI 工具（例如 Typeless）插入內容時，輸出常缺少 `- ` 或縮排不正確。這些行會被判定在聚焦分支之外，被聚焦遮罩整段藏起來，使用者以為內容沒寫進去，必須退出聚焦才看得到。

## Root Cause

聚焦的可見範圍由 `computeBranchRange` 決定：往下掃到第一個縮排層級較淺或非清單的行就結束分支。插入的純文字行破壞了清單連續性，分支因此提前結束，該行落在 `hiddenBlock` 遮罩範圍內完全不顯示。文字其實仍在檔案中，只是看不到。

## Proposed Solution

- **顯示安全網**：新增純函式 `scanStrayRange(state, anchor)`，自分支結尾往下掃描「脫隊行」——遇到縮排不深於聚焦 Bullet 的合法清單項目、Markdown 標題或程式碼圍欄即停止，其餘非空白行納入；尾端空行不納入。聚焦遮罩改以「分支結尾與脫隊範圍結尾的較大值」為界，讓這些行照常顯示，且不加任何額外標示或提示。
- **自動修復**：新增純函式 `planStrayLineRepair(state, anchor)`，把脫隊行正規化為聚焦 Bullet 的子項目——純文字行補上 `- ` 並縮排到子層，已有清單標記的行只重算縮排，脫隊區塊內的相對層級以最小共同縮排保留，空行原樣保留。子層縮排沿用既有的新增子項目縮排規則。
- **觸發時機**：聚焦中且文件變動時以 600 毫秒 debounce 排程，停止輸入後才執行；修復以獨立的 undo 步驟送出，使用者按一次 Undo 只會還原修復本身，不會連內容一起消失。無脫隊行時不產生任何交易。
- **設定**：新增 `autoFixStrayLines`（預設開啟）置於 `Focus page` 區塊，標籤 `Fix broken bullets`；關閉時仍保留顯示安全網，只是不自動改寫文件。

## Non-Goals

- 不對脫隊內容加任何視覺標示、提示或通知。
- 不修復聚焦分支「內部」既有的格式問題，只處理掉出分支的行。
- 不處理程式碼圍欄、frontmatter 與標題，掃描遇到即停止。
- 不在未聚焦的一般編輯狀態下自動修復。

## Success Criteria

- 聚焦時插入無清單標記的行，該行立即可見，不再被遮罩藏起。
- 停止輸入約 0.6 秒後，脫隊行自動成為聚焦 Bullet 的子項目，文字內容不變。
- 按一次 Undo 只還原修復，內容仍在。
- 下一個合法的同層或更淺層清單項目、標題、程式碼圍欄不會被誤收。
- 設定關閉時不再自動改寫，但內容仍可見。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
