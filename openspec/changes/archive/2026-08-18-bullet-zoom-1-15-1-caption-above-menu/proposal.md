## Problem

滑到某一格時顯示的指令名稱就放在中央取消鍵下方，而拇指與中央控制項正好都在那裡，訊息被遮住，很難看清楚自己選到什麼。

## Root Cause

說明標籤的位置以中央點為基準（下方 44 像素，空間不足時改為上方 60 像素），沒有把扇形本身與拇指佔用的區域算進去，因此永遠落在手指附近。

## Proposed Solution

- 標籤改以整個選單的外框為基準：取所有格子與中央控制項的座標範圍，把標籤放在外框上緣再往上一段距離，離開拇指與所有按鈕。
- 上方空間不足時（選單貼近可視區域頂端）改放到外框下緣之下，同樣保持間距。
- 水平位置以外框中心對齊，並夾在可視區域內，避免長名稱超出畫面。

## Non-Goals

- 不改變扇形版面、命中判定、動畫與凍結游標的行為。
- 不改變標籤在無高亮時隱藏的規則。

## Success Criteria

- 標籤位於所有格子與中央控制項之外，不被拇指遮擋。
- 選單靠近畫面頂端時標籤改置於選單下方，仍在可視區域內。
- 標籤水平置中且不超出畫面左右邊界。

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
