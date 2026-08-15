## Summary

編號清單項目（`1.`、`2)` 等）也能 Zoom 與進入大綱，並在設定頁新增兩個開關，分別控制「一般 Bullet」與「編號清單」的偵測。

## Motivation

外掛目前只支援 `-` 開頭的無序 Bullet，0.1.32 甚至刻意把有序清單底下的項目整批排除。使用者的筆記同時使用兩種清單，希望編號項目也能 Zoom，且能自行決定兩種清單各自要不要啟用偵測。

## Proposed Solution

- 解析層新增 marker 偵測設定（CodeMirror facet）：`bullets` 與 `numbered` 兩個布林。facet 的程式庫預設為「bullets 開、numbered 關」（與現行為完全相同）；外掛依使用者設定注入實際值。
- `findSupportedBullet` 支援 `數字.` 與 `數字)` 標記（多字元 marker），語法驗證改為「最近的清單祖先」判定：`-` 項目需在 BulletList、編號項目需在 OrderedList；numbered 關閉時维持 0.1.32 的有序清單全排除，開啟時解除排除。
- 兩個 outline builder 的有序排除條件改為只在 numbered 關閉時生效。
- 設定新增 `zoomBullets`（預設開）與 `zoomNumbered`（預設開），設定頁兩個 toggle；變更時重建 editor extension（Obsidian updateOptions）即時生效。
- Zoom、麵包屑、大綱、聚焦頁等既有機制沿用同一解析入口，自動繼承編號支援。

## Non-Goals

- 不支援任務清單（`- [ ]`）與 Setext 標題。
- 不改動編號項目在編輯器中的顯示（數字照常顯示）。
- 兩個開關都關閉時外掛等同停用偵測，不做額外警告。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
