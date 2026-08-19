## Problem

使用者回報標題偶爾還是會被加上 `- `。1.21.1 之後修復不會再對標題行動手，但 `- # Outline` 這種「標題被包進清單項目」的行仍然會出現，而且修復還會把它往內縮排，看起來就像外掛做的。

## Root Cause

`- # Outline` 多半不是修復產生的，而是 Obsidian 原生的清單接續：在清單裡按 Enter 時新行會自動補上 `- `，接著輸入 `# 標題` 就變成 `- # 標題`。對修復來說，這一行是合法的清單項目，所以會被保留並依規則重新縮排，等於幫倒忙。

## Proposed Solution

- 修復遇到「最外層清單項目，內容是標題」時，把清單標記拿掉、還原成真正的標題，並在該行停手。
- 只在拿掉標記後標題會落在第一欄時才還原，避免在巢狀位置產生沒有作用的縮排標題；巢狀的情況一律不動，直接停手。

## Non-Goals

- 不改變修復對一般文字與清單項目的處理。
- 不在沒有 Zoom 的情況下做任何事。
- 不改變 Obsidian 原生的清單接續行為。

## Success Criteria

- `- # Outline` 在修復後變回 `# Outline`，且該行之後的內容不被改寫。
- 巢狀的 `- # x` 維持原樣，修復在該行停手。
- 既有的標題邊界行為不變。

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
