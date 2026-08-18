## Problem

編輯器已有焦點（鍵盤在畫面上）時長按 Bullet，選單雖然開啟，但同一根手指繼續移動仍會拖動文字游標，游標也一直顯示。使用者得同時應付選單與游標，很難操作。

## Root Cause

長按開始時觸控落在可編輯內容上且編輯器已取得焦點，iOS 在選單出現之前就已接管該次觸控作為游標操作。選單覆蓋層是在 450 毫秒後才插入，無法收回系統已經開始的互動；編輯器保有焦點，游標也持續顯示。

## Proposed Solution

- 選單開啟時暫時停用編輯器互動：在編輯器根節點加上狀態 class，樣式讓內容區的游標顏色透明、停用文字選取與指標事件，游標因此不顯示也無法被拖動。
- 同時讓編輯器失去焦點，切斷系統對該次觸控的游標接管；原本是否有焦點會被記住。
- 選單關閉時（選取、取消、Escape、點覆蓋層外皆同）移除 class，並在原本有焦點時把焦點還給編輯器，游標與鍵盤回到長按前的狀態。
- 選單模組新增關閉回呼，確保上述還原在所有關閉路徑都會執行。

## Non-Goals

- 不改變選單版面、動畫與命中判定。
- 不改變指令執行方式與游標最終位置。
- 不在桌面版套用（選單本身即僅行動裝置啟用）。

## Success Criteria

- 選單開啟期間文字游標不顯示，手指移動不會拖動游標。
- 選單關閉後，若長按前編輯器有焦點則焦點回復，游標恢復正常。
- 取消、選取、Escape 與點選單外四種關閉路徑都會還原。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/radial-menu.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/radial-menu.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
