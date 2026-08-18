## Problem

1.10.0 之後仍有兩個問題：摺疊只有箭頭本身可以點，直覺上圓點左邊的整片空白都應該可以摺疊；而且摺疊箭頭與 Bullet 圓點在視覺上沒有對齊。

## Root Cause

1. 摺疊仍由 Obsidian 原生處理，可點範圍等於它自己的箭頭元素大小；外掛雖然已能精確判定「圓點左邊」這個區域，卻只是不介入，沒有承接摺疊動作。
2. 1.10.0 為了放大觸控目標，把 `.collapse-indicator` 設為 `min-height: 44px` 的 inline-flex 元素。這個高度遠大於一行文字的行高，撐開了行內盒模型，導致箭頭與圓點的垂直位置對不上。

## Proposed Solution

- 由外掛承接摺疊：既有的 capture 階段 `pointerdown` 判定已能區分摺疊區、圓點區與內容區。判定為摺疊區且該行可摺疊時，外掛自行以 CodeMirror 的摺疊效果切換該行的收合狀態，並消費該次手勢。可點範圍因此等於「行首到圓點之間的整片區域」，與縮排深度無關。
- 該行不可摺疊時完全不介入，游標定位與選字維持原生行為。
- 還原視覺對齊：移除外掛對 `.collapse-indicator` 的所有樣式覆寫，讓箭頭回到 Obsidian 原本的排版與對齊。觸控範圍由座標判定提供，不再需要以 CSS 撐大元素。

## Non-Goals

- 不改變摺疊本身的語意，仍是該行的收合與展開。
- 不改動圓點的 Zoom 行為與內容區的游標行為。
- 不接管大綱側欄的摺疊控制。

## Success Criteria

- 點擊圓點左邊的任何位置（含縮排空白）都能摺疊或展開該行。
- 摺疊箭頭與圓點在視覺上對齊，行高不被撐開。
- 不可摺疊的行在左側點擊時不被攔截。
- 圓點仍然 Zoom，文字仍然定位游標。

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
