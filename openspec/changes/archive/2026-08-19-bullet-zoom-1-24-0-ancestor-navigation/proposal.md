## Problem

`Go to parent bullet` 在沒有 Zoom 的情況下完全沒有反應：它只處理 Zoom session 的麵包屑，沒有 session 就直接放棄，也不說明原因。

而使用者真正的需求是：在很深的子 Bullet 裡編輯時，想快速回到最上層的父 Bullet 看脈絡，游標直接落在那個 Bullet 的文字最前面。目前沒有任何指令做得到。

## Proposed Solution

- 讓 `Go to parent bullet` 在沒有 Zoom 時把游標移到上一層 Bullet 的文字開頭；有 Zoom 時維持原本的往上一層 Zoom。
- 新增 `Go to top-level bullet`：一路往上走到最外層的祖先，游標落在它的文字開頭。
- 兩者都用縮排欄位往上找，不依賴語法樹；遇到標題就停，因為標題會切開清單。
- Zoom 狀態下不越過聚焦根節點，避免游標跑到看不到的地方。
- 找不到祖先時說明原因，不再靜默失敗。

## Non-Goals

- 不改變 Zoom 狀態下 `Go to parent bullet` 的既有行為。
- 不移動或改寫任何內容，只移動游標。

## Success Criteria

- 在深層子 Bullet 執行 `Go to top-level bullet`，游標落在最外層 Bullet 的文字最前面。
- 沒有 Zoom 時 `Go to parent bullet` 會移動游標而不是毫無反應。
- 已經在最外層時給出說明。

## Impact

- Affected specs: `openspec/specs/bullet-focus-parent-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/command-definitions.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
