## 1. 點擊開啟選單

- [x] 1.1 實作 **Choose what a marker tap does** 的設定與判定：`src/settings.ts` 新增 `markerTapAction`（`menu` 預設／`zoom`，未知值回退 `menu`）；`src/focus-extension.ts` 的選單設定 facet 增加 `openOnTap` 旗標，`MarkerPointerPlugin` 在啟用選單且為非滑鼠指標時——`openOnTap` 為真則不啟動計時器，於 `pointerup` 且位移未超過門檻時觸發選單請求；為假時維持既有的計時器分流；滑鼠維持立即 Zoom；驗證：`tests/focus-extension.test.ts` 覆蓋 spec 的四個 Scenario（點擊開選單、Zoom 模式短按 Zoom、位移取消、滑鼠立即 Zoom）。
- [x] 1.2 選單錨定圓點：選單請求改傳圓點量測座標（以 `coordsAtPos` 取得 marker 中心）而非放開位置；`src/main.ts` 依此座標開啟選單；驗證：`tests/focus-extension.test.ts` 斷言回呼收到的座標來自 marker 量測值而非事件座標。
- [x] 1.3 接上設定頁：`src/main.ts` 於 `Radial menu` 區塊新增 `Marker tap` 下拉（`Open the menu`／`Zoom into the bullet`），變更時重建 editor extensions；驗證：`tests/settings.test.ts` 斷言預設值與未知值正規化。

## 2. 清空指令

- [x] 2.1 實作 **Clear a bullet without removing it**：`src/list-structure.ts` 新增 `planBulletClear(state, anchor)`，回傳刪除標記之後到行尾的變更，該 Bullet 已無文字時回傳 null；`src/main.ts` 新增 `clear-bullet` 指令（名稱 `Clear bullet text`、圖示 `eraser`）沿用既有的 Bullet 指令檢查；`src/settings.ts` 把該指令加入預設插槽；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的兩個 Example，`tests/settings.test.ts` 更新預設插槽斷言。

## 3. 設定頁寬度

- [x] 3.1 實作 **Keep plugin settings within the panel width**：`src/main.ts` 為外掛建立的每個 `Setting` 加上 `bullet-zoom-setting` class；`styles.css` 讓該 class 下的控制項容器可縮小（`min-width: 0`）、`select` 與文字輸入限制最大寬度並可縮小；驗證：`tests/mobile-compatibility.test.ts` CSS 契約斷言規則存在且含 `max-width` 與 `min-width: 0`。
- [x] 3.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 4. 文件、版本與發布

- [x] 4.1 更新 `README.md` 與 `README.zh-TW.md` 說明點擊圓點預設開啟選單、Zoom 為選單中的一格；同步四個版本檔為 `1.16.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 4.2 `npm run build` 產生 `main.js`；驗證：build 成功且 bundle 含新設定。
- [ ] 4.3 commit 推送 main，release guard preflight（`--version 1.16.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機點擊開啟與設定頁寬度由使用者驗收。
