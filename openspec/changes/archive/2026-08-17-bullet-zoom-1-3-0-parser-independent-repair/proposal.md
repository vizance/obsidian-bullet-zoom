## Problem

1.2.x 的自動修復在實機沒有作用。聚焦時用 Typeless 口述進來的結構化內容仍然維持破碎的段落格式，使用者得手動一行一行補上 `- `。

## Root Cause

修復規劃 `planStrayLineRepair` 以 `scanStrayRange` 找出要修的行，而 `scanStrayRange` 依賴 `computeBranchRange` 與語法樹判定分支邊界。Obsidian 即時預覽的 HyperMD 語法樹與測試環境的 Lezer 解析結果不同，實機上掃描回傳 null，於是修復從未產生任何交易。同樣的解析差異也是 1.2.1 需要加上「可見範圍只增不減」保險的原因。

## Proposed Solution

- 修復改以「聚焦 session 記住的可見範圍」為工作區間，這個範圍在 1.2.1 已經是不依賴解析的狀態值。
- 行的分類全部改用正規表達式與縮排欄數計算，不再查語法樹：
  - 空行：保留原樣。
  - 已是清單項目且縮排深於聚焦 Bullet：視為合法子項目，不動。
  - 已是清單項目但縮排不深於聚焦 Bullet：保留標記與文字，重新縮排到子層。
  - 其餘非空行：保留文字原樣，於行首補上子層縮排與 `- `，於是每個換行都成為下一個 Bullet。
- 遇到程式碼圍欄即停止修復，避免破壞程式碼區塊；標題行不再中止掃描，而是連同 `#` 原樣包進 Bullet，內容零損失。
- 觸發時機與設定沿用既有的 600 毫秒 debounce、獨立 undo 步驟與 `Fix broken bullets` 開關；沒有需要修的行時不產生交易。

## Non-Goals

- 不刪除空行或合併段落。
- 不改寫任何一行的文字內容，只加縮排與清單標記。
- 不處理程式碼圍欄內部。
- 不在未聚焦狀態下修復。

## Success Criteria

- 聚焦時插入的多段純文字，在停止輸入約 0.6 秒後全部成為聚焦 Bullet 的子項目。
- 既有的合法子項目層級不變。
- 修復不依賴語法樹，可在 Obsidian 的 HyperMD 解析下運作。
- 按一次 Undo 只還原修復，內容仍在。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
