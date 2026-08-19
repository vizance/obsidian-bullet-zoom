## Problem

切換 Marker tap 之後，整個設定頁被重畫，捲動位置回到頂端，剛剛操作的下拉選單也從手指下面跑掉。使用者只是換一個選項，畫面卻整頁跳一次，體驗很差。大小滑桿的重設按鈕有同樣的問題。

## Root Cause

依選擇顯示設定是用「改完設定就呼叫 `display()` 重畫整頁」實作的。`display()` 會清空容器並重建每一列，所以捲動位置與焦點都會遺失。滑桿重設也走同一條路。

## Proposed Solution

- 把會跟著選擇變動的設定放進自己的容器，切換選項時只重建那個容器，其餘設定列與捲動位置維持不動。
- 滑桿重設改成直接把滑桿元件的值設回 100，不重畫設定頁。

## Non-Goals

- 不改變任何設定的內容、順序與儲存格式。
- 不改變哪些設定要在哪個選擇下出現。

## Success Criteria

- 切換 Marker tap 之後捲動位置不變，下拉選單留在原處。
- 相依設定仍然正確出現或消失。
- 按重設之後滑桿顯示 100，畫面沒有跳動。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/main.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `main.js`
