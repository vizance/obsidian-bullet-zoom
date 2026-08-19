## 1. 只留圖示按鈕

- [x] 1.1 依 **Choose the icon for each menu slot** 移除文字輸入：`src/main.ts` 的插槽列不再建立圖示輸入框與自動完成，圖示只從預覽按鈕開啟的選擇視窗設定；驗證：`npm run build` 通過、實機檢視。
- [x] 1.2 依 **Edit menu slots in a compact list** 調整版面：`styles.css` 移除輸入框樣式並讓指令選單吃下多出來的寬度；驗證：`tests/mobile-compatibility.test.ts` 的插槽版面契約更新後通過。

## 2. 條件式設定

- [x] 2.1 依 **Show only the menu settings that apply** 合併控制項：`src/main.ts` 以三選一取代啟用開關與點擊下拉，並依選擇儲存既有的兩個設定鍵；驗證：`tests/settings.test.ts` 覆蓋三種組合的正規化結果。
- [x] 2.2 依 **Show only the menu settings that apply** 依選擇顯示設定：長按時間只在長按模式出現，插槽清單只在選單可開啟時出現，變更後重畫；驗證：`npm run build` 通過、實機檢視。

## 3. 文件與發布

- [x] 3.1 更新 `README.md` 與 `README.zh-TW.md`；驗證：兩份說明一致。
- [x] 3.2 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 3.3 同步四個版本檔為 `1.22.0`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
