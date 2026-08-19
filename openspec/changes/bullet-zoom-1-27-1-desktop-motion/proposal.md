## Problem

在桌面版啟用選單後，開啟動畫不順，有 lag 感。

## Root Cause

兩個成本在桌面被放大：

1. 覆蓋層的 `backdrop-filter: blur(2px)` 蓋滿整個視窗。手機是一小塊螢幕，桌面是整個顯示器，每一幀要模糊的像素多好幾倍，而模糊發生在動畫進行的同時。
2. 格子的進場動畫有每格 24ms 的錯開，八格加起來把整段動畫拉到約 350ms。NN/g 的建議是大多數動畫落在 100 到 400ms，而且「找到不會突兀的最短時間」；桌面滑鼠使用者一分鐘會開好幾次選單，這個長度會被感受成延遲。

另外桌面的慣例本來就不同：原生右鍵選單是瞬間出現、沒有進場動畫。手機的動畫是為了說明「這個選單從你拇指按的那一點長出來」，滑鼠不需要這個解釋。

## Proposed Solution

- 由滑鼠開啟的選單走「瞬間模式」：覆蓋層不做模糊、不做淡入，格子不做錯開的進場動畫，只保留 90ms 的 hover 與選取回饋。
- 觸控開啟維持現狀，動畫是它的說明語言。
- 兩者共用同一套版面、插槽、命中判定與取消方式，差別只在動態表現。

## Non-Goals

- 不改變選單的結構、插槽設定與手勢語意。
- 不移除 `prefers-reduced-motion` 既有的處理。

## Success Criteria

- 桌面開啟選單即時出現，沒有等待感。
- 手機與平板的動畫完全不變。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/radial-menu.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/radial-menu.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
