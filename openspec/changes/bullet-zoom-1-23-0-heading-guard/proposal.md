## Problem

標題還是會變成 Bullet。實測確認修復本身不會加 `- `，`- # Outline` 是編輯器原生的清單接續產生的：在清單裡按 Enter，下一行自動補上標記，接著輸入的標題就落在標記後面。1.22.2 雖然會把它還原，但只在 Zoom 且自動修復開啟時才跑，所以一般編輯情況下那個 `- ` 會一直留著。

## Proposed Solution

- 在編輯器層加一道守門：任何一次編輯之後，如果某一行變成「最外層清單標記 + 標題」，就在同一個交易裡把標記拿掉。
- 因為修正與使用者的輸入同屬一個交易，按一次 Undo 會一起還原。
- 只處理沒有縮排的行，縮排位置拿掉標記只會得到無效的縮排標題。
- 只檢查這次編輯真正碰到的行，不掃描整份文件。
- 新增設定可以關閉，預設開啟；設定頁新增 `Editing` 區塊，把貼上整形與這道守門放在一起。

## Non-Goals

- 不改變 Zoom 狀態下的自動修復。
- 不改變 Obsidian 原生的清單接續行為本身。
- 不處理 `#tag` 這類沒有空白的井字號。

## Success Criteria

- 在清單裡按 Enter 後輸入標題，不會留下 `- `，不論有沒有 Zoom。
- 沒有被這次編輯碰到的行不受影響。
- 關閉設定後行為回到 Obsidian 原生狀態。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Added: `src/heading-unwrap.ts`
  - Added: `tests/heading-unwrap.test.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
