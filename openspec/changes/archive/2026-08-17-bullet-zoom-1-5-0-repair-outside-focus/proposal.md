## Summary

自動整理擴大到未聚焦的一般編輯狀態：在清單中口述或貼上內容時，同樣會把它整理成前一個清單項目底下的 Bullet。

## Motivation

目前自動修復只在聚焦模式生效。實際使用時，很多口述是在整份筆記的一般清單裡直接進行，這時內容一樣會被 Typeless 拆成破碎的段落，使用者又得手動補標記與縮排。

## Proposed Solution

- 未聚焦時改以「本次編輯範圍」為工作區間：外掛在 debounce 期間累積這批變更影響到的文件範圍（隨後續變更映射位置），停止輸入後只針對這個範圍判斷。
- 錨點必須是清單：自編輯範圍的第一行往上找（跳過空行），第一個非空行必須是清單項目才進行整理；若先遇到一般段落、標題或找不到清單項目，就完全不動作。這確保只有「在清單裡輸入」的情境才會被整理。
- 未聚焦時的規則比聚焦更保守：只轉換純文字行，任何已經是清單項目的行一律原樣保留、不重新縮排，避免與正在編輯的既有結構打架。
- 轉換出來的行縮排到最近一個清單項目的下一層，同一批彼此平輩；只有位於「第一個與最後一個被轉換行之間」的空行會被移除，前後的空行保留。
- 程式碼圍欄中止整理；文字不改寫；維持 600 毫秒 debounce、獨立 undo 步驟與 `Fix broken bullets` 開關；聚焦狀態下的行為完全不變。

## Non-Goals

- 不整理與清單無關的一般段落。
- 不重新縮排未聚焦狀態下既有的清單項目。
- 不改動聚焦模式既有的整理規則。
- 不把編號清單的新行改寫成延續編號。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
