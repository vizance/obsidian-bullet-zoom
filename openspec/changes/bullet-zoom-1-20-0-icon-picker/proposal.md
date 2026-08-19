## Problem

插槽的圖示只能用打字設定：使用者必須先知道 Obsidian 的圖示 ID 才填得出來。自動完成只在輸入幾個字之後才有幫助，而且清單只有文字，看不到圖示長什麼樣子，等於要求使用者背 ID。實際上使用者點了名稱旁邊的圖示預覽，期待跳出可以挑選的清單，但那個預覽目前不能點。

## Proposed Solution

- 把插槽的圖示預覽改成按鈕，點下去開啟圖示選擇視窗。
- 視窗提供搜尋欄與圖示網格，每一格畫出真正的圖示並附名稱，點一下就套用到該插槽。
- 視窗提供「使用指令圖示」的選項，等同把圖示欄清空。
- 圖示的過濾與命名邏輯抽成獨立模組，不依賴 Obsidian，方便測試。

## Non-Goals

- 不移除既有的文字輸入與自動完成，打字仍然可用。
- 不自製圖示，只列出 Obsidian 已載入的圖示。
- 不改變選單的行為與尺寸。

## Success Criteria

- 點插槽的圖示預覽會開啟選擇視窗，選一個圖示後預覽、輸入框與設定同步更新。
- 搜尋可以用圖示名稱過濾，結果有數量上限不會一次畫出全部圖示。
- 選「使用指令圖示」後該插槽回到沿用指令圖示的狀態。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Added: `src/icon-picker.ts`
  - Added: `tests/icon-picker.test.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
