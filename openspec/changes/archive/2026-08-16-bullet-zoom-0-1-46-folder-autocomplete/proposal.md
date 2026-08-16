## Summary

「拆分後的新筆記位置」欄位改為自動完成輸入：打字時即時列出 vault 中符合的既有資料夾，點選或以鍵盤選取即可填入。

## Motivation

目前資料夾要手動輸入完整路徑，打錯就會建立非預期的新資料夾，手機打字尤其麻煩。改用既有資料夾清單的自動完成後，選擇比輸入快、也避免拼錯。

## Proposed Solution

- 純邏輯層：`src/folder-suggest.ts` 匯出 `collectFolderPaths(vault)`（自 vault 取得所有資料夾路徑，排除 root、去重後依字典序排序）與 `filterFolderSuggestions(paths, query, limit)`（不分大小寫的子字串比對，前綴相符者優先，最多回傳 limit 筆，預設 8；查詢為空時回傳前 limit 筆）。
- UI 層：設定頁的資料夾欄位下方掛一個建議清單容器，輸入或聚焦時依目前值渲染建議項目；點擊項目即填入該路徑並儲存設定、關閉清單；ArrowDown／ArrowUp 移動選取、Enter 套用目前選取、Escape 關閉；失焦時關閉清單（延遲以允許點擊生效）。
- 樣式：建議清單以絕對定位浮在欄位下方，套用 Obsidian 既有色票，選取項目有高亮；手機維持 44px 觸控高度。

## Non-Goals

- 不改變設定值的儲存格式（仍為相對於 vault 根目錄的資料夾路徑字串）。
- 不阻止使用者輸入不存在的資料夾（維持自動建立行為）。
- 不在拆分視窗的檔名欄加自動完成。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - New: `src/folder-suggest.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - New: `tests/folder-suggest.test.ts`
  - Modified: `tests/obsidian-mock.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
