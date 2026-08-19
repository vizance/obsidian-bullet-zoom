## Problem

使用者回報：左邊視窗放著一則筆記完全不動，只在右邊視窗編輯別的筆記，大約十秒後左邊筆記的標題就被加上 `- `。查看實際檔案後確認那一行是 `\t- # Outline`——標題同時被加上縮排與清單標記，正是舊版自動修復的行為。

## Root Cause

主要原因是使用者桌機上的外掛仍停在 1.5.0，那個版本的整理會在沒有 Zoom 的情況下也動手。這是安裝版本問題，不是目前程式碼的缺陷。

但目前的程式碼仍有一個結構性弱點：自動修復只要求「這個編輯器有文件變更」與「這個編輯器有 Zoom session」，沒有要求使用者正在這個窗格裡打字。背景窗格的文件仍然可能因為同步、同一則筆記開在兩個窗格、或其他外掛而變更，這時修復就會改寫使用者根本沒有在看的筆記。

## Proposed Solution

- 自動修復只在有輸入焦點的編輯器窗格運作：排程時與真正動手前都檢查。
- 失去焦點時取消已排程的修復。

## Non-Goals

- 不改變修復的內容規則與邊界處理。
- 不改變沒有 Zoom 就不修復的既有限制。

## Success Criteria

- 背景窗格的文件變更不會觸發修復。
- 正在編輯的窗格行為不變。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
