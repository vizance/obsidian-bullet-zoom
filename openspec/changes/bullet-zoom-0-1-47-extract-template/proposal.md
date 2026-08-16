## Summary

拆分成新筆記時可套用模板檔：以 Note Composer 風格的佔位符把拆分內容填入模板骨架，模板檔可在設定中以自動完成選取。

## Motivation

拆出來的筆記常需要固定骨架（標題、日期、來源連結、標籤區塊），目前只能拿到純內容再手動補。指定模板後，拆分一次到位，格式也統一。

## Proposed Solution

- 純邏輯層：`src/extract-template.ts` 匯出 `renderExtractTemplate(template, values)`，支援 `{{content}}`、`{{title}}`、`{{date}}`、`{{time}}`、`{{source}}` 五個佔位符（不分大小寫、允許內部空白如 `{{ content }}`）；模板不含 `{{content}}` 時把內容接在模板尾端並以空行分隔；模板為空字串時直接回傳內容。未知佔位符原樣保留。
- 檔案清單：`src/folder-suggest.ts` 增加 `collectMarkdownPaths(vault)`（取 vault 內所有 `.md` 檔路徑，去重排序），供模板欄自動完成使用；沿用既有 `filterFolderSuggestions` 做過濾。
- 設定：新增 `extractTemplatePath`（字串，預設空＝不套模板），設定頁欄位沿用資料夾欄的自動完成互動（改吃 Markdown 檔清單）。
- 拆分流程：建立新檔前，若設定了模板路徑且該檔存在則讀取其內容（讀取失敗以 Notice 提示並中止），以 `renderExtractTemplate` 產生最終內容；`{{date}}`／`{{time}}` 以本地時間格式 `YYYY-MM-DD`／`HH:mm`；`{{source}}` 為來源筆記的 `[[basename]]`，無來源檔時為空字串。

## Non-Goals

- 不支援 Templater 語法或任意 JavaScript 執行。
- 不支援每次拆分挑選不同模板（單一預設模板）。
- 不改動既有的移除最上層 Bullet、目的資料夾與連結回填行為。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - New: `src/extract-template.ts`
  - Modified: `src/folder-suggest.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - New: `tests/extract-template.test.ts`
  - Modified: `tests/folder-suggest.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
