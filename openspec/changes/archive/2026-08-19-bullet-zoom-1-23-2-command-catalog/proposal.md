## Problem

Bullet 選單有時候整排圖示都是空的或變成一樣的預設點，過一陣子又恢復正常。

## Root Cause

選單的名稱與圖示是向 Obsidian 要 `listCommands()` 得到的。那個 API 回答的是「現在這個當下有哪些指令可以執行」，會依目前的上下文過濾，編輯器類指令在沒有作用中的編輯器時就不會出現。而選單自 1.14.0 起刻意不讓編輯器取得焦點（否則鍵盤會彈出來蓋住選單），所以打開選單的當下正好可能落在那個狀態，名稱與圖示就查不到，只剩預設圖示。

## Proposed Solution

- 改讀 Obsidian 的指令登錄表（一般指令與編輯器指令），它們與當下的可執行狀態無關；找不到時才退回 `listCommands()`。
- 外掛保留最後一次不是空的目錄，讓短暫查不到指令時仍然顯示上一份名稱與圖示。
- 設定頁的插槽指令選單改用同一份目錄。

## Non-Goals

- 不改變指令的執行方式，執行仍走 `executeCommandById`。
- 不改變插槽的設定格式與圖示解析順序。

## Success Criteria

- 沒有作用中的編輯器時打開選單，圖示與名稱仍然正確。
- 登錄表缺席或壞掉時不會拋錯，行為退回原本的清單查詢。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Added: `src/command-catalog.ts`
  - Added: `tests/command-catalog.test.ts`
  - Modified: `src/main.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `main.js`
