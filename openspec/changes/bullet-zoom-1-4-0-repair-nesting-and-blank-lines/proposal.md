## Summary

自動修復改為把口述進來的內容縮排到「前一個 Bullet」底下並彼此平輩，同時移除區塊中的空行，省去手動刪空行與縮排的步驟。

## Motivation

1.3.0 把脫隊的行一律修成聚焦 Bullet 的直接子項，且保留空行。實際使用時，口述內容是接著上一個 Bullet 講下去的，使用者每次都得手動再縮一層；殘留的空行也得逐一刪除。

## Proposed Solution

- **縮排基準改為前一個 Bullet**：修復時，需要修正的行以「該行之前最近一個合法清單項目」為基準，縮排到它的下一層；那個項目本身若是聚焦 Bullet，行為與現況相同。同一個待修區塊內的所有行使用同一個縮排，彼此平輩，不會逐行加深。
- **移除空行**：修復輸出不再保留區塊內的空行，讓修好的 Bullet 連續排列；區塊尾端若原本是空行，同樣不保留。
- 其餘規則不變：已正確巢狀在更深層的清單項目不動、已有標記的行只修縮排、文字不改寫、程式碼圍欄中止修復、無變更不產生交易、修復維持獨立 undo 步驟。

## Non-Goals

- 不逐行遞增縮排，同一區塊維持同層。
- 不合併或改寫任何一行的文字。
- 不移除修復區塊之外的空行。
- 不改動 `Fix broken bullets` 的開關與 600 毫秒 debounce。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
