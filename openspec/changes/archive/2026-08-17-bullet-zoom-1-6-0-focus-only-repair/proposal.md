## Problem

1.5.0 讓自動整理在未聚焦時也會運作，實機使用時會在一般編輯清單的過程中做出非預期的改動，干擾正常的 Bullet 操作。

## Root Cause

未聚焦時沒有明確的工作邊界，只能依「最近一次編輯範圍」與「上方最近的清單項目」推測使用者意圖。實際編輯清單時，這個推測經常與使用者當下的動作衝突：光是移動、換行或調整既有項目，就可能讓純文字行被判定為需要整理的內容。

## Proposed Solution

- 移除未聚焦時的自動整理：刪除 `planEditedListRepair` 與修復 plugin 內累積編輯範圍的邏輯，沒有聚焦 session 時一律不做任何文件修改。
- 自動整理回到只在聚焦模式運作，規則與 1.4.0 相同：縮排到前一個 Bullet 的下一層、同批平輩、移除空行、既有深層 Bullet 不動、程式碼圍欄中止、獨立 undo 步驟。
- 設定 `Fix broken bullets` 的說明改回只描述聚焦情境，設定鍵名與預設值不變。
- 同步移除相關測試與 README 中關於未聚焦整理的段落。

## Non-Goals

- 不改動聚焦模式的整理規則。
- 不移除設定項目本身。
- 不調整 600 毫秒 debounce 與獨立 undo 行為。

## Success Criteria

- 未聚焦時無論如何編輯清單，外掛都不會自動修改文件。
- 聚焦時的整理行為與 1.4.0 完全一致。
- 原始碼中不再有未使用的非聚焦整理函式。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
