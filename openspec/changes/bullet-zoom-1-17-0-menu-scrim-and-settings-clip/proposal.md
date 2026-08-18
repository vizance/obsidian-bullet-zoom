## Problem

選單開啟時背景維持原樣，圓形按鈕與筆記文字混在一起，不容易一眼看出選單的範圍與可操作區域。另外 1.16.0 對設定列加的寬度限制沒有解決設定頁左右滑動的問題。

## Root Cause

1. 選單覆蓋層的背景是完全透明的，沒有任何層次區隔；使用者必須靠按鈕本身的陰影去分辨選單與內容，在文字密集的筆記上分離度不足。這與 Obsidian 自身模態視窗的處理方式不同——原生 Modal 會以 `--background-modifier-cover` 覆蓋背景，讓內容退到後景。
2. 上一版只限制了設定列內控制項的寬度，但撐寬的元素仍可能超出外掛的設定容器並把祖先容器撐開；沒有在外掛自己的設定根節點阻擋水平溢出。

## Proposed Solution

- **加入背景遮罩**：選單覆蓋層改用 Obsidian 的模態遮罩色票 `--background-modifier-cover` 作為背景，並加上輕微的背景模糊，讓筆記內容退到後景、選單成為唯一焦點；遮罩與選單一起淡入，關閉時一併移除。減少動態設定開啟時不播放淡入。
- **標示操作對象**：在選單圓心繪製一個標示環，指出這次操作的是哪一個 Bullet，避免遮罩之後失去上下文。
- **修正設定頁溢出**：為外掛的設定容器加上專屬 class 並禁止水平溢出，配合既有的控制項寬度限制，確保任何長內容都不會把面板撐寬。

## Non-Goals

- 不改變選單的版面、命中判定、動畫時序與凍結游標行為。
- 不加入可調整遮罩深淺的設定。
- 不改動 Obsidian 設定面板本身的樣式，只處理外掛自己的容器。

## Success Criteria

- 選單開啟時背景明顯變暗，選單與按鈕清楚浮在最上層。
- 圓心有標示環指出操作中的 Bullet。
- 設定頁在任何寬度下都不能左右滑動。
- 減少動態設定開啟時遮罩不播放淡入。

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
