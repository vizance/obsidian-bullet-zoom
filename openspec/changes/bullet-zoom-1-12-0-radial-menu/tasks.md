## 1. Bullet 指令

- [x] 1.1 實作 **Run bullet commands from a radial menu** 的指令層：`src/main.ts` 新增三個 editorCheckCallback 指令——`copy-bullet`（以 `collectBulletCopyText` 依 `swipeCopyScope` 取代設定 `bulletCopyScope` 取得文字後寫入剪貼簿，含 `navigator.clipboard` 與 textarea 後援）、`delete-bullet`（以 `planBulletExtract` 取得分支範圍後用 `planBulletRemovalRange` 刪除含換行）、`insert-bullet-prefix`（以 `planBulletPrefixToggle` 切換設定的前綴）；游標不在支援的 Bullet 上時回傳 false 並在執行時以 Notice 說明；驗證：`tests/list-structure.test.ts` 既有的純函式測試維持通過，`npm run build` 無型別錯誤。

## 2. 徑向選單

- [x] 2.1 實作選單純邏輯：新增 `src/radial-menu.ts` 匯出 `RADIAL_SLOT_COUNT`（8）、`PRESS_DURATION_MIN`（250）、`PRESS_DURATION_MAX`（1000）、`PRESS_CANCEL_PX`（12）、`computeMenuSegments(slots)`（過濾空插槽並保留順序，回傳含 slot index 與 commandId 的陣列）與 `resolveSegmentAtPoint({ dx, dy, segmentCount, deadZone })`（依角度回傳 segment 索引，位移小於 deadZone 回傳 null 代表取消）；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的稀疏設定 Example、角度對應與中央死區。
- [x] 2.2 實作選單呈現與互動：`src/radial-menu.ts` 匯出 `openRadialMenu({ document, x, y, segments, onSelect, onCancel })`，以覆蓋層在指定座標繪製圓形選單與中央取消鍵，支援指針未離開時滑動高亮並於放開時選取、已放開時點選、點覆蓋層空白或 Escape 取消，回傳關閉函式；`styles.css` 新增選單樣式（圓形排列、44 像素觸控目標、主題色票）；驗證：`tests/radial-menu.test.ts` 以合成事件斷言選取回呼、取消回呼與關閉後移除節點。
- [x] 2.3 依 **Complete marker gesture zooms before native fold handling** 接上長按判定：`src/focus-extension.ts` 的 `MarkerPointerPlugin` 於非滑鼠指標且選單啟用時改為計時判定——`pointerdown` 記錄起點並啟動計時器且不立即 Zoom，計時器到期且位移小於 `PRESS_CANCEL_PX` 時呼叫注入的 `onLongPress(view, markerFrom, clientX, clientY)`，提前放開則執行 Zoom，位移超過門檻或 `pointercancel` 則取消；滑鼠指標與選單停用時維持按下即 Zoom；新增 `radialMenuConfig` facet 傳入啟用狀態、毫秒數與回呼；驗證：`tests/focus-extension.test.ts` 以假計時器覆蓋 spec 的短按、長按、位移取消與滑鼠四個 Scenario。
- [x] 2.4 接上外掛：`src/main.ts` 注入 facet 設定，`onLongPress` 先把游標移到該 Bullet 再呼叫 `openRadialMenu`，選取時以 `app.commands.executeCommandById` 執行對應指令；`src/settings.ts` 新增 `radialMenuEnabled`（預設 true）、`radialPressDuration`（250 至 1000、預設 450）、`radialSlots`（長度 8 的字串陣列、預設前五格為三個新指令與 zoom、extract、其餘空字串、非陣列或長度不符時正規化）；設定頁新增 `Radial menu` 區塊含開關、滑桿與八個下拉（選項來自 `app.commands.listCommands()`）；驗證：`tests/settings.test.ts` 斷言三個新設定的預設值與正規化。
- [x] 2.5 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 3. 文件、版本與發布

- [x] 3.1 更新 `README.md` 與 `README.zh-TW.md` 新增徑向選單章節與設定說明；同步四個版本檔為 `1.12.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [ ] 3.2 `npm run build` 產生 `main.js`；驗證：bundle 含選單邏輯、無 Node.js 或 Electron runtime import。
- [ ] 3.3 commit 推送 main，release guard preflight（`--version 1.12.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機長按與選單操作由使用者驗收。
