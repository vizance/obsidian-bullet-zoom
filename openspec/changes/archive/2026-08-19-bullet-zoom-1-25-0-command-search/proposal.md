## Problem

插槽的指令是用一個下拉選單挑的，而 Obsidian 一個 Vault 動輒好幾百個指令。要指定某一格就得一路捲，沒有辦法搜尋，找一個指令比設定它還花時間。

## Proposed Solution

- 插槽的指令改成按鈕，顯示目前選到的指令名稱，點下去開啟可搜尋的指令選擇視窗。
- 視窗提供搜尋欄與清單，每一列畫出指令自己的圖示與名稱；搜尋以空白分隔的每個詞比對名稱與指令 ID，名稱開頭符合的排前面。
- 一次只畫出上限數量的結果，開啟不會卡。
- 視窗提供「這一格留空」的選項，等同原本下拉選單的 Empty。
- 過濾邏輯放在既有的指令目錄模組，不依賴 Obsidian，方便測試。

## Non-Goals

- 不改變插槽的儲存格式與圖示解析。
- 不改變選單本身的行為。

## Success Criteria

- 在設定頁輸入關鍵字就能找到指令，不需要捲動整份清單。
- 選定後插槽按鈕顯示指令名稱，設定同步更新。
- 選「留空」後該格回到沒有指令的狀態。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/command-catalog.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/command-catalog.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
