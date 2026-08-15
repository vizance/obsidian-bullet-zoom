## Problem

手機版 Bullet 大綱的「Bullet 全文」視窗按關閉後，白色視窗（連同其中的全文文字）會先往下滑動一段距離才消失，讓關閉動作看起來延遲、不俐落。

## Root Cause

Obsidian 手機版的 Modal 關閉時會播放原生的下滑（bottom-sheet 滑出）動畫。外掛的 close 覆寫只隱藏了 modalEl（視窗本體），外層 containerEl 仍照原生流程播完下滑動畫後才移除，於是使用者看到視窗往下移動再消失。

## Proposed Solution

在 BulletLabelPreviewModal 的 close 覆寫中，於呼叫原生 close 前把 containerEl 一併隱藏，讓整個視窗（含背景遮罩）在關閉瞬間立即消失，不播放下滑動畫。行為對桌面與手機一致，且不影響其他外掛或 Obsidian 原生 Modal 的動畫。

## Non-Goals

- 不改動 Modal 的開啟動畫與內容排版。
- 不改動 0.1.34 已完成的捲動位置還原與 revealCurrent 鎖定機制。
- 不提供動畫開關設定。

## Success Criteria

- 按關閉（或 X、點背景）後，視窗與遮罩立即消失，無下滑位移。
- close 被重複呼叫時仍只執行一次（沿用既有 closing 防護）。
- `npm test`、`npm run lint`、`npm run build` 全數通過。
- 發布 0.1.35 至官方 repo，通過 release guard，可經 BRAT 更新；實體 iPhone 驗收由使用者確認。

## Impact

- Affected code:
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
