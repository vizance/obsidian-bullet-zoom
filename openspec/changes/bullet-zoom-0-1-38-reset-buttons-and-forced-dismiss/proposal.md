## Problem

1. 設定頁的兩條字級滑桿沒有快速回復預設值的方式，調亂之後要自己拖回 100%。
2. 0.1.35 的「Bullet 全文」視窗立即關閉修正在實機無效：視窗仍會往下滑一段才消失。

## Root Cause

1. 設定頁僅提供滑桿，未提供重設控制。
2. 0.1.35 以 `hidden` 屬性隱藏 modalEl 與 containerEl，但 `hidden` 只等於 UA 層級的 `display: none`，會被 Obsidian 主題樣式表對 `.modal-container` 宣告的 `display`（如 flex）覆蓋，因此元素從未真正隱藏，原生下滑關閉動畫照播。

## Proposed Solution

1. 兩條滑桿各加一顆重設 extra button（restore 圖示、tooltip「恢復預設 100%」），點擊即把該值設回 100、儲存並重繪設定頁讓滑桿歸位。
2. Modal close 覆寫改用行內樣式 `style.setProperty('display', 'none', 'important')` 強制隱藏 modalEl 與 containerEl（行內 important 優先權高於任何樣式表），再委派原生 close；沿用 closing 防護。

## Non-Goals

- 不改動滑桿範圍、間距與預設值。
- 不改動 Modal 的開啟動畫與內容。
- 不移除 0.1.35 的 hidden 設定（保留無害，僅補強）。

## Success Criteria

- 點擊重設按鈕後，對應滑桿值與持久化資料回到 100，畫面上滑桿位置同步歸位。
- 關閉「Bullet 全文」視窗時，modalEl 與 containerEl 的行內 display 為 none 且帶 important，原生 close 只執行一次。
- `npm test`、`npm run lint`、`npm run build` 全數通過。
- 發布 0.1.38，通過 release guard，可經 BRAT 更新；實機視窗瞬間消失由使用者驗收。

## Impact

- Affected code:
  - Modified: `src/main.ts`
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/obsidian-mock.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
