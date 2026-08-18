## Problem

長按叫出選單在實機不夠精準：按住的那段時間拇指難免移動，選單跟著手指位置開在不確定的地方。另外外掛的設定頁可以左右滑動，內容沒有置中對齊，操作時會有飄移感。

## Root Cause

1. 選單以長按計時觸發，並以按下時的座標為圓心；長按期間手指的自然位移會改變開啟位置，也可能超過取消門檻而失敗。
2. 設定頁的下拉選單載入 vault 內所有指令，名稱很長；`select` 元素沒有寬度上限，撐出比設定面板更寬的內容，因而產生水平捲動。

## Proposed Solution

- **改為點擊開啟選單**：新增設定決定點擊圓點的行為——開啟選單（預設）或直接 Zoom。設為開啟選單時，圓點的點擊在指標放開且位移未超過門檻時開啟選單，不再需要長按；設為 Zoom 時維持既有行為。長按計時路徑保留給選擇 Zoom 的使用者，行為不變。
- **選單錨定在圓點**：選單改以圓點本身量測到的座標為圓心，而不是手指放開的位置，因此同一個 Bullet 每次都在相同位置展開。
- **新增清空指令**：新增 `Clear bullet text` 指令，只刪除該 Bullet 標記之後的文字，保留標記、縮排與所有子項目，讓使用者留下一個空的 Bullet 繼續輸入；已經是空的 Bullet 不產生任何變更。此指令加入預設插槽。
- **修正設定頁寬度**：為外掛建立的設定列加上專屬 class，限制控制項與下拉選單的最大寬度並允許縮小，使內容不超過面板寬度，消除水平捲動。

## Non-Goals

- 不改變選單版面、命中判定、動畫與凍結游標的行為。
- 不改變摺疊區與內容區的判定。
- 不調整 Obsidian 設定面板本身的樣式，只限制外掛自己建立的列。

## Success Criteria

- 預設情況下點一下圓點就開啟選單，選單以圓點為圓心。
- 設定改為 Zoom 時，點擊圓點直接 Zoom，長按仍可開啟選單。
- 設定頁不再能左右滑動，所有控制項落在面板寬度內。
- 執行清空指令後，該 Bullet 只剩標記與縮排，子項目維持不變。

## Impact

- Affected specs: `openspec/specs/bullet-zoom-mobile-reliability/spec.md`, `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
