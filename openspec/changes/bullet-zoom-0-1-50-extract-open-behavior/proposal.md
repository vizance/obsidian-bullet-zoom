## Summary

拆分完成後可自行決定停留在原筆記或開啟新筆記，開啟方式支援目前分頁、新分頁或右側分割，比照 Note Composer 的行為設定。

## Motivation

目前拆分後一律留在原筆記，想接著編輯新筆記得自己去找檔案。有人拆分後想馬上補內容（希望自動開啟），有人只是把內容搬走想繼續整理原筆記（希望留著不動）。做成設定讓兩種工作流都順。

## Proposed Solution

- 設定新增 `extractOpenBehavior`，值為 `stay`（預設）、`current`、`tab`、`split`，以下拉選單呈現於 `Extract to new note` 區塊，標籤 `After extracting`，選項文字為 `Stay in the current note`、`Open the new note`、`Open the new note in a new tab`、`Open the new note in a split`。
- 拆分成功並完成原文替換後才依設定開啟：`stay` 不做任何事；`current` 以目前分頁開啟新檔；`tab` 以新分頁開啟；`split` 以右側分割開啟。開啟失敗時以 Notice 提示但不影響已完成的拆分結果。
- 設定值為未知字串或缺漏時正規化為 `stay`。

## Non-Goals

- 不改變拆分本身的內容產生、模板套用與替換行為。
- 不提供每次拆分時臨時切換開啟方式。
- 不處理開啟後的游標定位。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
