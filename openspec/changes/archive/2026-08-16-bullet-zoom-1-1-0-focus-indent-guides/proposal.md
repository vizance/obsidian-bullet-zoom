## Summary

聚焦頁的子項目加上垂直縮排引導線，用視覺線條標示層級關係，做法接近 Outliner 與 Workflowy；可在設定關閉。

## Motivation

Zoom 進 Bullet 後，子項目只靠縮排距離區分層級，行一多就不容易一眼看出哪些項目屬於同一個父節點，手機窄畫面尤其明顯。加入垂直引導線後，同一層的項目被一條連續的線串起來，層級關係直接可見。

## Proposed Solution

- 以 CSS 背景漸層在每個已重定基準的清單行畫出祖先層級的垂直線：使用 `repeating-linear-gradient` 產生週期等於縮排單位的細線，並以 `background-size` 限制在 `相對深度 × 縮排單位` 的寬度內，讓深度為 N 的行剛好畫出 N 條祖先引導線，線的位置對齊各層 Bullet 標記。
- 線條使用主題色票 `--background-modifier-border`，寬度 1px，不影響版面尺寸與點擊區域；連續多行的背景相接即形成連續直線。
- 設定新增 `focusIndentGuides`（預設開啟），置於 `Focus page` 區塊，標籤 `Indent guides`；開啟時外掛在 `document.body` 掛上 `bullet-zoom-indent-guides` class，所有引導線樣式都以該 class 為前綴，關閉或停用外掛即完全還原。

## Non-Goals

- 不在 Bullet 大綱側邊欄畫引導線（本次僅聚焦頁）。
- 不提供線條顏色、粗細或樣式的自訂選項。
- 不改動聚焦頁既有的縮排計算與標題排版。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `styles.css`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
