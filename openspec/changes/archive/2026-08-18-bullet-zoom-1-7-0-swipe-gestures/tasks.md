## 1. 手勢與動作

- [x] 1.1 實作 **Act on bullets with horizontal swipes** 的純邏輯：新增 `src/swipe-gestures.ts` 匯出 `SWIPE_DISTANCE_PX`（60）、`SWIPE_VERTICAL_CANCEL_PX`（24）、`SWIPE_EDGE_MARGIN_PX`（24）與 `classifySwipe(deltaX, deltaY)`；`src/list-structure.ts` 新增 `planBulletPrefixToggle(state, anchor, prefix)`（已存在則移除、否則於標記後插入，prefix 為空或非 Bullet 回傳 null）與 `collectBulletCopyText(state, anchor, scope)`（`text` 回傳該 Bullet 純文字、`branch` 回傳整段分支並去除共同縮排）；驗證：`tests/swipe-gestures.test.ts` 覆蓋 spec 的分類表，`tests/list-structure.test.ts` 覆蓋插入、移除與兩種複製範圍。
- [x] 1.2 實作手勢掛載：`src/swipe-gestures.ts` 匯出 `createSwipeExtension(options)`，以 pointerdown／pointermove／pointerup／pointercancel 追蹤單一非滑鼠指標，套用邊緣忽略與垂直取消規則，成立時解析所在行的 Bullet 並呼叫對應回呼，並抑制隨後的 click；兩個方向皆為 `none` 時回傳空擴充；驗證：`tests/swipe-gestures.test.ts` 以合成 pointer 事件斷言方向判定、垂直捲動不觸發、邊緣起點被忽略、滑鼠指標不觸發。
- [x] 1.3 接上設定與外掛：`src/settings.ts` 新增 `swipeRightAction`／`swipeLeftAction`（`none`／`prefix`／`copy`，預設 `prefix`／`copy`，未知值回退預設）、`swipePrefixText`（預設 `> [!note] `、非字串回退預設）、`swipeCopyScope`（`text` 預設／`branch`）；`src/main.ts` 於設定頁新增 `Swipe gestures` 區塊四個項目、把設定注入 `createSwipeExtension`，並在這些設定變更時重建 editor extensions；複製動作以 `navigator.clipboard.writeText` 寫入，失敗時退回暫時 textarea 與 `document.execCommand('copy')`，成功與失敗各顯示對應 Notice；驗證：`tests/settings.test.ts` 斷言四個新設定的預設值與正規化。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 新增手勢章節與設定說明；同步四個版本檔為 `1.7.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含手勢邏輯、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.7.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機手勢與剪貼簿由使用者驗收。
