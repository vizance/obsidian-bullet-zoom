## Summary

在編輯器的 Bullet 上加入左右滑動手勢：一邊在 Bullet 文字最前面插入自訂文字（用來套 Obsidian callout 樣式），另一邊把整個 Bullet 內容複製到剪貼簿；方向、文字與複製範圍都可在設定調整。

## Motivation

手機上要替某個 Bullet 加上 callout 前綴，得把游標移到文字開頭再打一長串符號；要複製一段 Bullet 內容，得先長按選取、再拖選取範圍、再按複製。兩件事都很常做，用滑動手勢一次完成可以省下大量操作。

## Proposed Solution

- 新增 `src/swipe-gestures.ts`：以 pointer 事件在編輯器內容區偵測水平滑動，僅接受非滑鼠指標（觸控與手寫筆），水平位移超過 60 CSS 像素且大於垂直位移兩倍才成立；垂直位移超過 24 像素即取消，避免與捲動衝突；起點位於畫面左右各 24 像素邊緣內時忽略，避免與 Obsidian 原生側欄手勢衝突。成立時取消該次點擊，不移動游標。
- 動作一「插入前綴」：在 Bullet 標記之後插入設定的文字；若該文字已經緊接在標記之後，則改為移除，形成切換行為。
- 動作二「複製 Bullet」：把 Bullet 內容寫入剪貼簿並顯示提示；複製範圍可設定為僅該 Bullet 的文字，或包含其所有子項目（子項目維持相對縮排，輸出時整體去除共同縮排）。
- 純邏輯抽成可測函式：`classifySwipe` 判斷手勢方向、`planBulletPrefixToggle` 產生插入或移除的變更、`collectBulletCopyText` 產生要複製的文字。
- 設定新增 `Swipe gestures` 區塊：`Swipe right`／`Swipe left` 各為下拉（`Nothing`／`Insert prefix text`／`Copy bullet`，預設右為插入前綴、左為複製）、`Prefix text`（預設 `> [!note] `）、`Copy scope`（`Bullet text` 預設／`Bullet and children`）。兩個動作皆設為 `Nothing` 時完全不掛載手勢處理。

## Non-Goals

- 不支援滑鼠拖曳觸發手勢，避免干擾文字選取。
- 不支援垂直手勢與多指手勢。
- 不提供每個 Bullet 各自不同的前綴文字。
- 不改動聚焦、大綱與拆分等既有功能。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - New: `src/swipe-gestures.ts`
  - Modified: `src/list-structure.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - New: `tests/swipe-gestures.test.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
