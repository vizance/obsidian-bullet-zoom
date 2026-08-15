## Problem

0.1.39 的 Workflowy 化在實機出現三個問題：

1. 大綱列排版錯亂：編號跑到內容上方、行與行對不齊。
2. 葉節點的小圓點使用者不喜歡（偏好原本純編號的設計）。
3. 麵包屑每層被 6.5em 截斷成「…」，還是看不到完整上層路徑；且大綱列的「…」預覽按鈕與截斷省略號「…」混淆。

## Root Cause

1. 0.1.39 重寫編號樣式時遺漏了原有的 `display: inline-flex` 與 `min-width`，導致 grid 內元素塌陷換行。
2. 圓點是 0.1.39 新增的設計，與使用者偏好不符。
3. 麵包屑加了 `max-width: 6.5em` 逐層截斷；預覽按鈕沿用「…」字元與省略號視覺相同。

## Proposed Solution

1. 編號樣式回復 0.1.38 的原始規則（inline-flex、min-width 24px、muted 色），保留 0.1.39 的手機縮排加深（12px／層）。
2. 移除葉節點圓點：JS 回復為空白佔位元素，刪除 is-dot 樣式與對應測試。
3. 麵包屑取消非目前層的 max-width 截斷，完整顯示每層文字，過長靠面板水平捲動；預覽按鈕改為放大鏡 SVG 圖示（aria-label 維持「查看全文」語意）。

## Non-Goals

- 不改動階層編號的內容與格式。
- 不改動 Zoom、摺疊互動與 44px 觸控標準。
- 不改動桌面版麵包屑行為。

## Success Criteria

- 大綱列恢復單行對齊：編號、三角形、文字在同一列。
- 葉節點無圓點，佔位為空白。
- 手機麵包屑每層顯示完整文字、可水平捲動；預覽按鈕為 SVG 圖示且無「…」字元。
- `npm test`、`npm run lint`、`npm run build` 全數通過；發布 0.1.40 供 BRAT 驗收。

## Impact

- Affected code:
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `styles.css`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
