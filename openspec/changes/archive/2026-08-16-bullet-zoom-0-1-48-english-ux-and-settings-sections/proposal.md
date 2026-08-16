## Summary

外掛全面改用簡明英文（指令、通知、面板、視窗、設定），並把設定頁依用途分成四個區塊，讓選項一眼看懂。

## Motivation

設定項目已累積到八個，全部平鋪在一頁，看不出哪些是同一件事的選項。介面文字目前為中文，限制了外掛對外發布與國際使用者採用；統一改成簡短、動詞開頭的英文 UX writing 也讓語氣一致。

## Proposed Solution

- 設定頁改為四個具標題的區塊，依使用流程排序：
  1. `Zoom` — Zoom bullets、Zoom numbered items
  2. `Outline` — Outline text size（含重設按鈕）
  3. `Focus page` — Focus title size（含重設按鈕）
  4. `Extract to new note` — Destination folder、Template file、Remove the top bullet
- 所有面向使用者的字串改為英文：指令名稱、Ribbon 提示、Notice 訊息、麵包屑與大綱面板文字、全文預覽與拆分視窗、無障礙標籤。
- UX writing 原則：標題用名詞短語（Title Case 僅首字大寫）、說明用完整句、按鈕用動詞（Create／Cancel／Close）、錯誤訊息說明狀況並給下一步、避免產品行話。
- 空節點顯示改為 `Untitled bullet`、未命名筆記為 `Untitled note`、大綱視圖名稱為 `Bullet outline`。

## Non-Goals

- 不做多語系框架或語言切換設定。
- 不改動任何功能行為、預設值與設定鍵名（僅顯示文字與版面）。
- 不改 README 之外的文件翻譯。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/main.ts`
  - Modified: `src/command-definitions.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `src/list-structure.ts`
  - Modified: `styles.css`
  - Modified: `tests/command-definitions.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
