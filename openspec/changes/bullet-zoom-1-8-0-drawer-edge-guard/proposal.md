## Problem

1.7.0 的 Bullet 滑動手勢在實機幾乎無法使用：不論左滑或右滑，Obsidian 手機版原生的側邊抽屜都會被觸發，蓋過外掛的手勢。

## Root Cause

Obsidian 行動版的抽屜手勢並非只在畫面邊緣生效，而是在整個工作區監聽水平滑動。外掛的手勢處理掛在編輯器內容元素上，事件仍會往上冒泡到 Obsidian 的抽屜處理器，因此兩者同時成立時抽屜優先。

## Proposed Solution

- 新增抽屜邊緣守門：在 window 的捕捉階段監聽 `touchstart` 與 `touchmove`。`touchstart` 只記錄起點與是否落在 Markdown 編輯器內容區，不阻擋任何事件；`touchmove` 在「守門啟用、位於行動裝置、起點落在編輯器內容區、起點距離畫面左右邊緣皆超過設定的邊緣寬度」四項同時成立時呼叫 `stopPropagation`，讓 Obsidian 的抽屜處理器收不到移動事件。
- 只停止事件傳遞、不呼叫 `preventDefault`，因此瀏覽器原生的捲動、文字選取與游標行為完全不受影響。
- 邊緣寬度改為單一設定值，同時決定兩件事：抽屜只在該寬度內可滑出，外掛手勢只在該寬度外成立，兩者互補沒有重疊。
- 設定新增 `Limit drawer to screen edge`（預設開啟）與 `Drawer edge width`（滑桿，8 至 80 像素，預設 24），置於 `Swipe gestures` 區塊；守門在設定變更時即時重新掛載，外掛停用時移除監聽。

## Non-Goals

- 不修改 Obsidian 本身的設定或原始碼。
- 不阻擋垂直捲動、文字選取與點擊。
- 不在桌面版掛載守門。
- 不改變既有手勢的距離與方向判定規則。

## Success Criteria

- 守門啟用時，在編輯器中央區域左右滑動不再開啟抽屜，外掛手勢可正常成立。
- 自畫面左右邊緣起手的滑動仍可開啟抽屜。
- 垂直捲動、長按選取與點擊行為不受影響。
- 守門關閉或在桌面版時，行為與 Obsidian 原生完全相同。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/swipe-gestures.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/swipe-gestures.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
