## Problem

手機版 Bullet 大綱中，點「…」開啟「Bullet 全文」Modal、再按關閉後，大綱清單會在關閉後的下一拍往下捲動，畫面出現延遲位移，使用者會跟丟原本瀏覽的位置。

## Root Cause

關閉路徑上有兩個互相疊加的捲動來源：

1. Modal 的 onClose 會對觸發的「…」按鈕執行 focus 並帶 preventScroll 選項，但 iOS WebKit 經常無視 preventScroll，在焦點落定後非同步把按鈕捲進可視範圍。
2. Modal 關閉觸發 Obsidian 的 layout-change，大綱經延遲排程重繪；重繪時若 revealCurrent 判定脈絡改變，會對目前節點執行 scrollIntoView，造成第二次事後捲動。

## Proposed Solution

- Modal 關閉後不再把焦點還給觸發按鈕（「…」按鈕與此 Modal 只存在於手機版渲染，桌面版沒有這顆按鈕，無行為可保留）；改為在 Modal 開啟前記錄大綱 body 的 scrollTop，關閉後的重繪完成時原位還原。
- 讓 Modal 的開關週期不改變 revealCurrent 的判定脈絡：只有真正切換筆記、切換 Zoom 節點或使用者要求定位時，才允許 scrollIntoView 自動定位。

## Non-Goals

- 不改動「…」按鈕的出現條件與 Modal 的內容排版。
- 不重做大綱的重繪排程機制（80ms／40ms 延遲策略維持不變）。
- 不處理編輯器本文的捲動行為（本次僅限大綱側欄）。

## Success Criteria

- 手機模式下開啟並關閉「Bullet 全文」Modal 後，大綱 body 的 scrollTop 與開啟前一致，且不對任何節點執行 scrollIntoView。
- 桌面模式下大綱不渲染「…」按鈕（既有行為不變）。
- 真正切換筆記或 Zoom 節點時，revealCurrent 自動定位照常運作。
- `npm test`、`npm run lint`、`npm run build` 全數通過。
- 發布 0.1.34 至官方 repo，通過 release guard，可經 BRAT 更新；實體 iPhone 驗收由使用者確認，不得自行宣稱完成。

## Impact

- Affected code:
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
