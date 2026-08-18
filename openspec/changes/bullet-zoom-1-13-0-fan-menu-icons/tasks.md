## 1. 扇形版面與圖示

- [x] 1.1 實作 **Run bullet commands from a radial menu** 的扇形版面：`src/radial-menu.ts` 以 `computeFanLayout({ x, y, count, viewportWidth, viewportHeight, radius })` 取代 `segmentOffset`，回傳展開方向與每一格的絕對座標——觸控點位於畫面左半時朝右、否則朝左，弧線垂直範圍依上下可用空間收斂並夾在可視範圍內；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的左緣、右緣與上緣三個 Example。
- [x] 1.2 實作最近命中判定：以 `resolveNearestItem({ x, y, items, hitRadius, deadZone })` 取代 `resolveSegmentAtPoint`，回傳最近且在命中半徑內的索引，位於中央死區時回傳 null；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的最近者勝出 Example 與死區。
- [x] 1.3 改為圖示與說明標籤：`openRadialMenu` 接受 `renderIcon(element, segment)` 回呼繪製每一格內容並以 `aria-label` 保留指令名稱，另在選單中央下方繪製說明標籤，指標移動時顯示目前高亮項目的名稱、無高亮時顯示取消提示；`styles.css` 調整為圓形圖示按鈕與標籤樣式；驗證：`tests/radial-menu.test.ts` 斷言回呼被呼叫、標籤隨高亮更新、無高亮時顯示取消提示。
- [x] 1.4 實作插槽開關：`src/settings.ts` 的 `radialSlots` 改為 `{ commandId: string; enabled: boolean }` 陣列，正規化時把舊版純字串轉為啟用狀態、補滿八格；`computeMenuSegments` 只保留啟用且有指令的插槽；`src/main.ts` 設定頁每一格同時提供指令下拉與啟用開關；驗證：`tests/settings.test.ts` 斷言預設值、舊格式轉換與長度補滿，`tests/radial-menu.test.ts` 斷言停用的插槽不產生項目。
- [x] 1.5 接上外掛：`src/main.ts` 傳入 `renderIcon`，以 Obsidian 的 `setIcon` 依指令的圖示繪製、沒有圖示時使用備援圖示；為外掛自己的三個 Bullet 指令設定圖示；驗證：`npm run build` 無型別錯誤。
- [x] 1.6 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 的選單章節（扇形展開、圖示、說明標籤）；同步四個版本檔為 `1.13.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含扇形版面、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.13.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機在最上層 Bullet 的展開方向與圖示辨識由使用者驗收。
