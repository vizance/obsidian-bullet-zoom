## 1. 抽屜守門

- [x] 1.1 實作 **Confine the mobile drawer swipe to the screen edge** 的純邏輯與掛載：`src/swipe-gestures.ts` 新增 `shouldBlockDrawerGesture({ startX, viewportWidth, edgeZone, startedInEditor })`（起點在編輯器內且距左右邊緣皆大於 edgeZone 時回傳 true）與 `installDrawerEdgeGuard(window, options)`（於 window 捕捉階段掛 `touchstart`／`touchmove`／`touchend`／`touchcancel`，touchstart 僅記錄狀態，touchmove 依判定呼叫 `stopPropagation` 且不呼叫 `preventDefault`，回傳移除監聽的函式）；編輯器內容區以 `.cm-content` 祖先判定；驗證：`tests/swipe-gestures.test.ts` 覆蓋 spec 的四個 Example 與移除監聽後不再阻擋。
- [x] 1.2 邊緣寬度改為參數：`createSwipeExtension` 接受 `edgeZone` 選項取代常數，兩者共用同一設定值；驗證：`tests/swipe-gestures.test.ts` 斷言自訂 edgeZone 下邊緣起手的手勢被忽略。
- [x] 1.3 接上設定與生命週期：`src/settings.ts` 新增 `limitDrawerToEdges`（布林、預設 true）與 `drawerEdgeZone`（數字、8 至 80、預設 24、非數字或超界正規化）；`src/main.ts` 在 `Swipe gestures` 區塊新增對應 toggle 與滑桿，onload 時依設定與 `Platform.isMobile` 安裝守門、設定變更時重新安裝、onunload 時移除，並把 `drawerEdgeZone` 傳入 `createSwipeExtension`；驗證：`tests/settings.test.ts` 斷言兩個新設定的預設值與正規化。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明抽屜守門與邊緣寬度設定；同步四個版本檔為 `1.8.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含守門邏輯、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.8.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機抽屜與手勢共存由使用者驗收。
