## 1. 選單尺寸

- [x] 1.1 依 **Size the bullet menu for the device** 加入尺寸解析：`src/radial-menu.ts` 新增 `RadialMenuSize` 與 `resolveMenuMetrics`，回傳按鈕、圖示、半徑、命中半徑與死區；`openRadialMenu` 接受 size 並把按鈕與圖示尺寸寫成覆蓋層的 CSS 變數；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的兩個 Example（large 大於 regular、覆蓋層帶出 CSS 變數）。
- [x] 1.2 依 **Run bullet commands from a radial menu** 讓扇形半徑隨格子數成長：`src/radial-menu.ts` 新增 `resolveFanRadius`，`openRadialMenu` 以它決定實際半徑；驗證：`tests/radial-menu.test.ts` 覆蓋「八格時半徑大於基準」的 Example。
- [x] 1.3 依 **Size the bullet menu for the device** 讓樣式讀變數：`styles.css` 的按鈕與圖示尺寸改用 `--bullet-zoom-radial-button` 與 `--bullet-zoom-radial-icon`；`src/main.ts` 在平板送出 large 尺寸；驗證：`tests/mobile-compatibility.test.ts` 覆蓋樣式表 Example。

## 2. 插槽圖示

- [x] 2.1 依 **Choose the icon for each menu slot** 擴充設定：`src/settings.ts` 的 `RadialSlot` 新增 `icon`，`normalizeSlots` 支援舊格式；驗證：`tests/settings.test.ts` 覆蓋「圖示會被正規化且舊設定預設為空」的 Scenario。
- [x] 2.2 依 **Run bullet commands from a radial menu** 讓項目帶著圖示：`src/radial-menu.ts` 的 `computeMenuSegments` 輸出 icon；`src/main.ts` 依「插槽圖示 → 指令圖示 → 預設」解析；驗證：`tests/radial-menu.test.ts` 覆蓋圖示覆寫與解析順序的 Example。
- [x] 2.3 依 **Choose the icon for each menu slot** 加入設定 UI：`src/main.ts` 每個插槽新增圖示輸入框（自動完成 `getIconIds()`）與名稱旁的預覽；驗證：`npm run build` 通過、實機確認。

## 3. 文件與發布

- [x] 3.1 更新 `README.md` 與 `README.zh-TW.md` 的選單章節；驗證：兩份說明一致。
- [x] 3.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 3.3 同步四個版本檔為 `1.18.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
