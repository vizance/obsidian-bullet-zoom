## Problem

在手機上點擊 Bullet 圓點的結果不穩定：編輯器已取得焦點時會 Zoom，但在未取得焦點（例如剛捲動完）時點同一個位置，卻會觸發 Obsidian 原生的摺疊。使用者無法預期同一個動作的結果。此外為了避開這個衝突，摺疊箭頭的觸控範圍被壓到 24 像素，遠小於 44 像素的觸控標準，變得難以點中。

## Root Cause

兩個問題疊加：

1. 外掛只在 `click` 攔截 marker（`markerClickHandler` 是全專案唯一的事件處理器），但 Obsidian 的摺疊在指標按下時就已完成，`click` 抵達時攔截為時已晚。主規格 `Complete marker gesture zooms before native fold handling` 要求在手勢開始時就處理，實作已與規格漂移。
2. 判定依賴 `.bullet-zoom-marker` 元素是否存在於 DOM。即時預覽對作用中與非作用中的行渲染方式不同，該元素在未聚焦時可能不存在，判定因此隨焦點狀態改變；找不到元素且點在 `.collapse-indicator` 內時，外掛會直接讓路給原生摺疊。

## Proposed Solution

- 改以座標判定，不再依賴 marker 元素是否渲染：以點擊座標透過 `posAtCoords` 取得文件位置，解析該行的 Bullet，再用 `coordsAtPos` 量出 marker 起訖與內容起點的水平座標，將該行切成摺疊區、marker 區與內容區三段。marker 區為 marker 左右邊界外擴少量容錯，且不越過內容起點。
- 改在 capture 階段的 `pointerdown` 攔截：以 ViewPlugin 於 `view.dom` 註冊 capture 監聽，早於 Obsidian 掛在摺疊元素上的處理器。判定為 marker 區時執行 Zoom、`preventDefault`、`stopPropagation`，並抑制隨後的 `click`，使一次實體手勢只產生一次轉換。
- 判定不為 marker 區時完全不介入，摺疊、游標定位與選字維持原生行為。
- 既有的 `click` 攔截保留為桌面滑鼠的後援路徑。
- 還原摺疊觸控範圍：移除手機上把 `.collapse-indicator` 壓到 24 像素的規則，改為最小 44 像素高度的舒適觸控目標，且不向右延伸越過 marker。

## Non-Goals

- 不改變 Zoom 的既有行為與 fold-aware 展開規則。
- 不處理長按與選單（後續變更）。
- 不改動大綱側欄的摺疊控制。

## Success Criteria

- 無論編輯器是否已取得焦點，點擊圓點都會 Zoom。
- 點擊摺疊箭頭仍然摺疊，且觸控目標恢復到至少 44 像素高。
- 點擊文字仍然定位游標，選字與捲動不受影響。
- 一次點擊只觸發一次轉換。

## Impact

- Affected specs: `openspec/specs/bullet-zoom-mobile-reliability/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `styles.css`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
