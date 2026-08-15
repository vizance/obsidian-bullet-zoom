## Summary

Zoom 進深層 Bullet 後，聚焦頁的標題與子項目改以聚焦節點為基準重新排版：標題滿版顯示、子項目以相對深度縮排，窄畫面不再被原始縮排擠壓。

## Motivation

手機上 Zoom 進縮排兩三層的 Bullet 時，標題（粗體大字）與內文仍沿用原始清單深度的懸掛縮排（padding-inline-start 加負 text-indent），折行後的每一行都被推到畫面右半邊，一行只能顯示幾個字，閱讀與編輯體驗都很差。聚焦頁既然把該節點當成「頁面」，排版就應該以它為基準，而不是以整份文件的絕對深度為基準。

## Proposed Solution

- 聚焦根行（標題）：以 CSS 覆寫該行的 text-indent 與 padding-inline-start 為 0（前綴字元既有機制已隱藏），讓標題與其折行使用完整版面寬度；手機模式標題字級改用可伸縮的 clamp 值，避免過大。
- 聚焦分支內的子項目行：在 focusPageDecorations 為每行加上 (1) replace 裝飾隱藏整段行首縮排字元、(2) line 裝飾寫入相對深度 CSS 變數與 rebased class；styles.css 以 !important 依相對深度重建懸掛縮排（padding-inline-start 為 (深度+1) 個縮排單位、text-indent 負一單位），與 Obsidian 原始深度脫鉤。
- 相對深度以分支內各行行首縮排寬度對應層級計算，深度上限 8；非清單的續行不處理。
- 效果適用桌面與手機（自適應），停用外掛即還原。

## Non-Goals

- 不改動未聚焦（一般編輯）狀態下的清單縮排與 Obsidian 原生排版。
- 不改動麵包屑、頁尾與新增子項目等聚焦頁其他元件。
- 不處理聚焦分支內非 Bullet 的續行段落縮排。
- 不提供縮排單位設定選項。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `styles.css`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
