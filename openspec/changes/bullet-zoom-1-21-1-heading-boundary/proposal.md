## Problem

在最外層用標題（`#`）分隔 Bullet 群組時，自動修復會把標題行當成一般文字，替它加上 `- ` 變成 Bullet，標題就這樣被吃掉。標題前後的空行也會一起被移除，等於整個分段結構被破壞。

## Root Cause

`planFocusStructureRepair` 只把程式碼區塊當成邊界，沒有把標題列入邊界。掃描可見範圍的 `scanStrayRange` 早就會在標題停下，但修復本身不會，所以只要標題落在可見範圍內就會被改寫。另外空行是在遇到下一行內容之前就被丟棄，即使後面遇到邊界而停手，前面那些空行也已經被算進替換範圍。

## Proposed Solution

- 讓修復在標題行停下，和程式碼區塊一樣視為邊界，標題與其後的內容都不再被改寫。
- 替換範圍改成結束於最後一行真正被修復的內容，讓邊界之前的空行原封不動留著。

## Non-Goals

- 不改變修復對一般文字行與逃脫清單項目的處理。
- 不改變只在 Zoom 狀態下運作的限制。
- 不改變偵測可見範圍的邏輯。

## Success Criteria

- 可見範圍內的標題維持標題，不會被加上 Bullet 標記。
- 標題前的空行維持原樣。
- 標題之前的一般文字行仍然照常被修好。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
