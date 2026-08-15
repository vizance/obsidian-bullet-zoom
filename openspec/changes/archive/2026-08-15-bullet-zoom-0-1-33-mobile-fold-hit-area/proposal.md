## Problem

在手機（iPhone）的 Live Preview 編輯器中，點擊帶有子項目、縮排兩到三層的 Bullet 時，會觸發 Obsidian 原生的 Fold/Unfold，而不是進入 Bullet Zoom 的聚焦（Zoom）。使用者因此無法在手機上順暢地逐一進入各個 Bullet。

## Root Cause

Obsidian 手機版為了易於點按，將清單行原生摺疊控制元件 `.collapse-indicator` 的觸控範圍放大，覆蓋了 Bullet 圓點與其鄰近區域。外掛的 `markerClickHandler` 在偵測到點擊目標位於 `.collapse-indicator` 內且無法解析為精確 Bullet marker 時會主動讓路（回傳 false），於是事件交回 Obsidian 原生摺疊處理，Zoom 從未被觸發。

## Proposed Solution

採輕量 CSS 方案：僅在手機模式（外掛既有的 `Platform.isPhone` 判斷）下，為編輯器面板掛上外掛專屬的手機模式 class，並以該 class 為前綴撰寫樣式，把清單行 `.collapse-indicator` 的可點擊範圍限縮回摺疊圖示本身所在的小區塊，使 Bullet 圓點與文字區的點擊全數落入 Bullet Zoom 的 marker 判定。摺疊功能仍可用：點擊限縮後的圖示區塊照常觸發原生 Fold/Unfold。桌面版不掛此 class、完全不受影響；標題（Heading）的摺疊控制不在選擇器範圍內；停用外掛後樣式隨之卸載，一切還原為 Obsidian 原生行為。

## Non-Goals

- 不攔截或改寫 pointer/touch 事件的傳遞順序（重量級方案，僅在 CSS 方案於實機驗證失敗時另開 change 處理）。
- 不自製摺疊按鈕、不隱藏原生摺疊控制元件。
- 不變更桌面版任何行為，不變更 Heading 摺疊行為。
- 不變更 Bullet 大綱側欄（outline sidebar）的行為。

## Success Criteria

- 手機模式下，點擊帶子項目且縮排兩到三層的 Bullet 圓點或文字，觸發 Bullet Zoom 聚焦，不觸發原生 Fold/Unfold。
- 手機模式下，點擊限縮後的摺疊圖示區塊，仍可正常 Fold/Unfold。
- 非手機模式（桌面）下，DOM 不含手機模式 class，摺疊行為與 0.1.32 完全相同。
- `npm test`、`npm run lint`、`npm run build` 全數通過；`styles.css` 的新選擇器均以手機模式 class 為前綴。
- 發布 0.1.33 至官方 repo，通過 release guard，可經 BRAT 更新安裝；實體 iPhone 驗收在使用者確認前不宣稱完成。

## Impact

- Affected specs: `openspec/specs/bullet-zoom-mobile-reliability/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `styles.css`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
