## Problem

插槽列上有一個圖示 ID 的文字輸入框，佔掉一整欄，而且 placeholder 只寫得下半句「Icon — empty uses the c...」。一般使用者根本不知道那格要填什麼，也不需要知道 Obsidian 的圖示 ID。1.20.0 已經提供圖示選擇視窗之後，這個輸入框就變成多餘的第二條路。

選單設定也有同樣的問題：即使把圓點點擊設成 Zoom，下面仍然列出八個插槽讓人設定；而「啟用選單」開關與「圓點點擊」下拉其實描述同一件事，兩個控制項組合出來的狀態要自己推理。

## Proposed Solution

- 移除插槽列的圖示文字輸入框與它的自動完成。
- 圖示一律從預覽按鈕開啟的選擇視窗設定，清除也在視窗裡完成。
- 預覽按鈕加上說明性的無障礙標籤，讓它明確是「選擇圖示」的入口。
- 設定值本身不變，既有的圖示 ID 照常沿用。
- 把「啟用選單」與「圓點點擊」合併成單一的三選一：只開選單、只 Zoom、Zoom 但長按開選單。
- 依選擇顯示相關設定：選「只 Zoom」時隱藏插槽與長按時間，選「只開選單」時隱藏用不到的長按時間。

## Non-Goals

- 不改變圖示的解析順序與儲存格式。
- 不改變選擇視窗的搜尋與網格行為。
- 不移除其他插槽控制項。

## Success Criteria

- 插槽列只剩編號、圖示按鈕、指令選單與開關，指令名稱有更多顯示空間。
- 點圖示按鈕仍然可以選擇或清除圖示，設定與預覽同步更新。
- 舊設定檔裡已存在的圖示 ID 仍然生效。
- 圓點點擊選 Zoom 時看不到插槽設定，選單相關設定只在會用到時出現。
- 既有設定檔不需要遷移，兩個既有鍵值照舊儲存。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/main.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `styles.css`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
