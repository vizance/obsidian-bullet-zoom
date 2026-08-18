## 1. 移除手勢與守門

- [x] 1.1 移除 **Act on bullets with horizontal swipes** 與 **Confine the mobile drawer swipe to the screen edge** 的實作：刪除 `src/swipe-gestures.ts` 與 `tests/swipe-gestures.test.ts`；`src/main.ts` 移除手勢擴充、`copyTextToClipboard`、`runSwipeAction`、守門欄位與其生命週期呼叫、相關 import；驗證：`npm run build` 無未解析匯入或未使用變數錯誤。
- [x] 1.2 移除設定：`src/settings.ts` 刪除 `swipeRightAction`、`swipeLeftAction`、`swipePrefixText`、`swipeCopyScope`、`limitDrawerToEdges`、`drawerEdgeZone` 六個鍵與其型別、常數與正規化函式；`src/main.ts` 移除 `Swipe gestures` 設定區塊；`tests/settings.test.ts` 同步移除相關斷言與物件欄位；驗證：`npx vitest run tests/settings.test.ts` 通過。
- [x] 1.3 保留通用 Bullet 操作：確認 `planBulletPrefixToggle` 與 `collectBulletCopyText` 及其測試維持可用且無編譯警告；驗證：`npx vitest run tests/list-structure.test.ts` 通過。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 移除 `README.md` 與 `README.zh-TW.md` 的滑動手勢與抽屜守門章節，設定區塊數量改回四區；同步四個版本檔為 `1.9.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 不再含手勢或守門字串、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.9.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機原生手勢恢復由使用者驗收。
