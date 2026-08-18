## Problem

設定頁的插槽列排版變形：名稱欄被壓縮到只剩兩個字元的寬度，「Slot 1」被斷成「S.」與「1」兩行，啟用開關也被擠到下拉選單下方，整列看起來凌亂。

## Root Cause

1.16.0 為了避免水平溢出，對控制項容器同時加上 `min-width: 0` 與 `flex-wrap: wrap`。這讓控制項可以無限延展並換行，於是下拉選單佔滿可用寬度、把名稱欄壓到最小，開關則被換到下一行。名稱欄本身沒有最小寬度保護。

## Proposed Solution

- 讓外掛的設定列在窄畫面改為上下排列：名稱與說明佔一整行，控制項另起一行靠左排列，兩者都不再互相擠壓。
- 名稱欄設定最小寬度並允許收縮，避免文字被斷成單字元。
- 控制項容器改為單行不換行，下拉選單可收縮並填滿剩餘寬度，開關維持固定寬度排在其後。
- 寬畫面維持 Obsidian 原本的左右排列，只套用收縮保護。

## Non-Goals

- 不改變任何設定項目的內容、順序與行為。
- 不調整 Obsidian 設定面板本身的樣式，只處理外掛自己的列。
- 不移除既有的水平溢出裁切。

## Success Criteria

- 窄畫面下名稱完整顯示在一行，不再被斷成單字元。
- 下拉選單與開關排在同一行，開關不再被換到下方。
- 設定頁仍然不能左右滑動。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `styles.css`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
