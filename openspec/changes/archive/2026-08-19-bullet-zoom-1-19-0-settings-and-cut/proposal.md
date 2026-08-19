## Problem

設定頁已經長到 25 列以上，卻仍然是一條平坦的清單：分區只有四個標題、沒有說明，八個插槽各佔一整列，在 iPad 上每一列的控制項被撐得很大，插槽名稱、指令下拉、圖示欄與開關四者互相搶空間，看起來凌亂。圖示欄的 placeholder 寫 `Command icon`，讀起來像「這裡要填指令」而不是「留空就用指令的圖示」。

另外有兩個設定（複製範圍 `bulletCopyScope` 與前綴文字 `bulletPrefixText`）只存在於設定檔，設定頁完全沒有入口，使用者只能靠預設值。

功能面缺一個常用動作：把某個 Bullet 連同它的子項目剪下——複製到剪貼簿並從筆記移除，一步完成搬移。

## Proposed Solution

- 重新編排設定分區為六段，每段標題附一句說明：`Zoom`、`Focus page`、`Outline`、`Bullet commands`、`Bullet menu`、`Extract to new note`，每個選項移到語意相符的段落。
- 補上缺少入口的兩個設定：複製範圍與前綴文字，放進新的 `Bullet commands` 段。
- 插槽改用外掛自己的緊湊版面：每一格一列，左邊是編號與圖示預覽，接著指令下拉、圖示欄與啟用開關，寬度不足時才換行。圖示欄改寫成「留空＝使用指令圖示」的提示文字。
- 新增 `Cut bullet` 指令：把該 Bullet 與其所有子項目複製到剪貼簿，複製成功後才從筆記移除；複製失敗時保留原文並說明。

## Non-Goals

- 不改變任何既有設定的鍵名、預設值與行為。
- 不改變選單的手勢、尺寸與動畫。
- 不為剪下另外設計範圍選項，剪下固定含子項目。

## Success Criteria

- 設定頁六段各有標題與說明，插槽列在 iPad 上排成整齊的一行。
- 複製範圍與前綴文字可以在設定頁調整。
- `Cut bullet` 可以從指令面板與選單插槽執行，剪貼簿拿到整段內容、筆記中該分支被移除。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `styles.css`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
