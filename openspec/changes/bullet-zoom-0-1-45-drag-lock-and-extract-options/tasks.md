## 1. 拖移鎖定與拆分選項

- [x] 1.1 實作 **Lock outline scrolling while dragging**：`src/outline-sidebar-view.ts` 的拖移控制器在 `beginDrag` 記錄 body scrollTop 並加上 dragging class，拖移期間於 pointermove 還原該 scrollTop，`reset` 時移除 class 並回復捲動位置；`styles.css` 讓 `.bullet-zoom-outline-sidebar-body.bullet-zoom-outline-dragging` 的 `touch-action: none`、`overflow: hidden`；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言該規則存在，`tests/outline-sidebar-view.test.ts` 斷言拖移結束後 class 移除且 scrollTop 不變。
- [x] 1.2 實作 **Configure the extract destination and prefill the name** 的名稱處理：`src/list-structure.ts` 新增 `suggestExtractFileName(label)`（trim、`[[x]]` 與 `[x](y)` 取顯示文字、移除 `\\/:*?"<>|#^[]` 等不合法字元、合併多餘空白）；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的 sanitization Example 與純文字、空字串情境。
- [x] 1.3 接上設定與 Modal：`src/settings.ts` 新增 `extractFolder`（字串正規化、去除首尾斜線與空白，預設空字串）；`src/main.ts` 設定頁加文字輸入欄（說明留空＝與目前筆記同資料夾）、`ExtractNameModal` 接收預設名稱並在開啟時填入並 select、拆分路徑改依 `extractFolder` 決定並在資料夾不存在時 `vault.createFolder`，失敗以 Notice 中止；驗證：`tests/settings.test.ts` 斷言 extractFolder 預設值與正規化（含 `/Cards/` 去斜線、非字串回預設）。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.45`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含拖移鎖定與資料夾設定、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.45`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機拖移穩定度與拆分預設值由使用者驗收。
