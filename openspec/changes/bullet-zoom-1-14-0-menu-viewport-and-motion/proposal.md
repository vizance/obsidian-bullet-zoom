## Problem

長按位於畫面下半部的 Bullet 時，鍵盤彈出後會蓋住剛開啟的選單，下方的格子點不到。另外選單是瞬間出現的，沒有任何過場，操作起來缺乏回饋感。

## Root Cause

1. 開啟選單前呼叫了 `view.focus()`，在行動裝置上這個動作會叫出軟體鍵盤，於是選單開啟的同時畫面可用高度被壓縮；版面計算又以 `window.innerHeight`（版面視窗）為準，不會隨鍵盤縮小，因此格子被放到鍵盤底下。
2. 選單節點直接插入畫面，沒有任何進場過場，使用者無法從動態上確認手勢已被接受。

## Proposed Solution

- **不叫出鍵盤**：開啟選單時只把游標移到目標 Bullet，不再呼叫 `view.focus()`。指令仍以游標位置運作，因此行為不變，但鍵盤不會因為長按而彈出。
- **改用可視視窗計算版面**：版面接受可視區域的上緣與高度（呼叫端以 `visualViewport` 提供，沒有時退回 `innerHeight`），扇形的展開範圍、每一格座標、中央按鈕與說明標籤都夾在這個可視區域內。因此即使鍵盤已經在畫面上，選單仍會落在看得到的範圍。
- **加入進場動畫**：格子以中央為起點淡入並放大到定位，依序有極短的延遲形成擴散感；中央取消鍵同時淡入；高亮切換改為帶過場的縮放。所有動畫在使用者開啟系統減少動態設定時停用。

## Non-Goals

- 不改變長按時間、命中判定與指令執行方式。
- 不加入關閉動畫以外的其他效果與音效。
- 不改動桌面版行為。

## Success Criteria

- 長按畫面下半部的 Bullet 時鍵盤不會被叫出，選單完整可見。
- 鍵盤已經在畫面上時開啟選單，所有格子仍落在可視區域內。
- 選單出現時有短暫的擴散進場動畫，滑到某格時該格有放大回饋。
- 系統設定為減少動態時不播放動畫。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/radial-menu.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/radial-menu.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
