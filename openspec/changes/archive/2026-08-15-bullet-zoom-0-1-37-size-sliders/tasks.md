## 1. 設定模組與套用

- [x] 1.1 實作 **Provide size sliders for the focus title and the outline** 的資料層：新增 `src/settings.ts`，匯出 `DEFAULT_SETTINGS`（titleScale 100、outlineScale 100）、範圍常數（60–160、step 5）、`normalizeSettings(raw)`（非數字回預設、超界夾範圍、四捨五入到整數）與 `applyScaleVariables(body, settings)`／`clearScaleVariables(body)`（寫入與移除 `--bullet-zoom-title-scale`、`--bullet-zoom-outline-scale`，值為百分比 ÷ 100）；驗證：`tests/settings.test.ts` 覆蓋正規化表（含 "abc" 回 100、300 夾 160）與變數寫入移除。
- [x] 1.2 在 `src/main.ts` 接上生命週期：onload 時 `loadData` → normalize → 套用變數並註冊 PluginSettingTab（兩條滑桿 60–160 step 5、setDynamicTooltip、變更時 saveData 並重新套用）；onunload 時清除變數；驗證：`tests/settings.test.ts` 以 mock body 斷言 onload 套用、變更後更新、onunload 清空。
- [x] 1.3 `styles.css` 改為倍率驅動：聚焦標題桌面規則字級乘上 `var(--bullet-zoom-title-scale, 1)`、手機 clamp 規則同樣乘上倍率；新增 `.bullet-zoom-outline-sidebar { font-size: calc(1em * var(--bullet-zoom-outline-scale, 1)); }`，`.is-mobile` 版改為 `calc(var(--font-ui-smaller, 0.9em) * var(--bullet-zoom-outline-scale, 1))`；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言四處皆引用對應變數。
- [x] 1.4 `tests/obsidian-mock.ts` 補最小 `Setting` mock（setName／setDesc／addSlider 鏈式 API）供設定頁測試；驗證：`npm test` 全數通過。
- [x] 1.5 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.37`、更新版本斷言、`README.md` 補版本紀錄與設定說明；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 scale 變數邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.37`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全、BRAT 可更新；實體 iPhone 滑桿手感驗收由使用者確認。
