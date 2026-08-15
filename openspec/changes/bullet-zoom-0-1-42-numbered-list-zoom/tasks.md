## 1. 偵測層與設定

- [x] 1.1 實作 **Configure marker detection for bullets and numbered items** 的解析層：`src/list-structure.ts` 新增 `markerDetectionFacet`（預設 bullets true、numbered false）、有序項目 pattern（`數字.`／`數字)`、多字元 markerTo）；`findSupportedBullet` 依 facet 分別嘗試兩種 pattern；`isSupportedBulletSyntaxNode` 改為最近清單祖先判定並在 numbered 關閉時維持有序全排除；兩個 outline builder 的 `isOrdered || isInsideOrderedList` 排除改為僅 numbered 關閉時生效；驗證：`tests/list-structure.test.ts` 覆蓋「numbered 開啟可解析 `2. Second`」「bullets 關閉時 `- A` 回 null」「numbered 關閉時舊排除不變（既有測試不動）」「開啟後大綱含編號項目」。
- [x] 1.2 接上外掛層：`src/settings.ts` 新增 `zoomBullets`／`zoomNumbered`（皆預設 true、布林正規化）；`src/focus-extension.ts` 的 `createFocusExtension` 增加 `markerDetection` 選項並注入 facet；`src/main.ts` 改用可變陣列註冊 editor extension，設定變更時重建陣列並呼叫 `workspace.updateOptions()`，設定頁加兩個 toggle；驗證：`tests/settings.test.ts` 斷言預設值、布林正規化與 toggle 變更後的持久化資料。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過且既有 0.1.32 排除測試不需修改。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.42`、更新版本斷言、`README.md` 補版本紀錄與設定說明；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 markerDetection 邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.42`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機編號 Zoom 與開關由使用者驗收。
