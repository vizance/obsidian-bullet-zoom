## Problem

選單中央下方在沒有高亮任何一格時會顯示「Release to cancel」提示，這句話沒有提供有用資訊，只是佔用畫面。另外圖示按鈕的陰影太淡，圓形按鈕與底下的文字內容分不太開。

## Root Cause

說明標籤在無高亮時以取消提示作為預設文字，而不是留空。圖示按鈕沿用 `--shadow-s`，在淺色主題與文字密集的畫面上分離度不足。

## Proposed Solution

- 說明標籤只在有高亮項目時顯示該指令名稱；沒有高亮時標籤清空並隱藏，不再顯示取消提示。取消行為本身不變，中央仍是取消鍵。
- 圖示按鈕與中央取消鍵改用較明顯的自訂陰影，讓圓形按鈕浮在內容之上；高亮時陰影加深，維持與主題色票一致。

## Non-Goals

- 不改變選單的版面、命中判定與動畫時序。
- 不移除中央取消鍵。
- 不調整按鈕尺寸。

## Success Criteria

- 開啟選單且未指向任何一格時，中央下方沒有文字。
- 指向某一格時顯示該指令名稱，移開後回到隱藏。
- 圖示按鈕有明顯陰影，高亮時陰影更深。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/radial-menu.ts`
  - Modified: `styles.css`
  - Modified: `tests/radial-menu.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
