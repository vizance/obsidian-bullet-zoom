## 1. 座標判定與早期攔截

- [x] 1.1 實作 **Complete marker gesture zooms before native fold handling** 的分區判定：`src/focus-extension.ts` 新增純函式 `classifyLineTapZone({ x, markerLeft, markerRight, contentLeft, tolerance })` 回傳 `'fold' | 'marker' | 'content'`（marker 區為 markerLeft 減容錯至 markerRight 加容錯，但上限不超過 contentLeft；小於下限為 fold；其餘為 content）；驗證：`tests/focus-extension.test.ts` 覆蓋 spec 的 zone table（x 20、46、56、90 對應 fold、marker、marker、content）。
- [x] 1.2 實作 capture 階段攔截：新增 ViewPlugin，於 `view.dom` 以 capture 註冊 `pointerdown`，以 `posAtCoords` 解析位置、`findSupportedBullet` 取得 Bullet、`coordsAtPos` 量測 marker 與內容起點，判定為 marker 區時呼叫既有的 `activateBulletMarker`、`preventDefault`、`stopPropagation` 並設旗標抑制隨後的 `click`；量測失敗、非主要指標或非 marker 區時完全不介入；destroy 時移除監聽；驗證：`tests/focus-extension.test.ts` 斷言未聚焦時按下 marker 會 Zoom、fold 區與內容區的按下不被攔截、隨後的 click 不產生第二次轉換。
- [x] 1.3 還原摺疊觸控範圍：`styles.css` 移除手機上把 `.collapse-indicator` 限制為 24 像素與清除虛擬元素的規則，改為 `min-height: 44px` 的舒適觸控目標並確保不向右延伸越過 marker；驗證：`tests/mobile-compatibility.test.ts` 的 CSS 契約斷言改為摺疊控制在手機上至少 44 像素高。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明圓點與摺疊箭頭的分區與觸控目標；同步四個版本檔為 `1.10.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含座標判定、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.10.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機在有無焦點兩種狀態下的圓點點擊由使用者驗收。
