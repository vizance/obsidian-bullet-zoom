## Summary

參考 Workflowy 的視覺語言重排 Bullet 大綱與麵包屑：大綱列緊湊化（編號保留但縮小淡化、三角形貼緊文字、葉節點顯示小圓點、縮排加深），麵包屑完整顯示每一層路徑。

## Motivation

實機對比 Workflowy 後，目前大綱有三個可讀性問題：編號欄與置中的箭頭欄把文字推到畫面中段、葉節點只有空白佔位看不出是項目、手機縮排每層只差 4px 層級不明顯。麵包屑則把中間祖先層全部藏起來，深層 Zoom 時看不出自己在哪條路徑上。

## Proposed Solution

- 大綱列（保留階層編號）：編號改小字級、淡色、靠右貼齊三角形；三角形在欄內靠右貼緊文字（觸控範圍維持 44px）；葉節點的佔位改為淡色小圓點；手機每層縮排從 4px 加深為 12px（上限第 6 層）；列的視覺留白收緊但維持 44px 觸控高度。
- 麵包屑：取消手機隱藏中間祖先層的規則，完整顯示「家 › 每一層 › 目前節點」；分隔符號改為顯示；面板水平可捲動；每一層最大寬度約 6.5em 超出以省略號截斷，目前節點維持彈性收縮。
- 純樣式與渲染微調，不改資料模型與互動行為；停用外掛即還原。

## Non-Goals

- 不移除階層編號、不新增編號開關（使用者已確認保留）。
- 不改變 Zoom、摺疊、全文預覽等互動行為與 44px 觸控標準。
- 不做滑動手勢、鍵盤工具列、搜尋過濾（另列後續提案）。

## Impact

- Affected specs: `openspec/specs/bullet-outline-switcher/spec.md`, `openspec/specs/bullet-focus-navigation/spec.md`
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
