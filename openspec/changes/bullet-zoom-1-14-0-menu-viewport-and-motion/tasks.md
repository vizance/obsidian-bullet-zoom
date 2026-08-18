## 1. 可視區域與動畫

- [x] 1.1 實作 **Keep the bullet menu inside the visible viewport** 的版面：`src/radial-menu.ts` 的 `computeFanLayout` 與 `openRadialMenu` 接受 `viewportTop` 與 `viewportHeight` 描述可視區域，扇形展開角度依可視區域的上下餘裕計算，所有格子座標夾在 `viewportTop + padding` 到 `viewportTop + viewportHeight - padding` 之間；中央按鈕與說明標籤同樣夾在該範圍內，標籤在下方放不下時改置於中央上方；驗證：`tests/radial-menu.test.ts` 覆蓋 spec 的鍵盤遮蔽與偏移可視區兩個 Example，以及標籤翻轉。
- [x] 1.2 不叫出鍵盤：`src/main.ts` 開啟選單時移除 `view.focus()`，僅 dispatch 游標位置，並以 `window.visualViewport` 的 `offsetTop` 與 `height` 傳入可視區域，無此 API 時退回 `innerHeight`；驗證：`npm run build` 無型別錯誤且既有選單測試通過。
- [x] 1.3 實作 **Animate the bullet menu**：`openRadialMenu` 為每一格設定遞增的動畫延遲自訂屬性；`styles.css` 加入自中央擴散的淡入放大 keyframes、中央鍵淡入、高亮縮放改為 transition，並以 `prefers-reduced-motion` 區塊停用所有動畫與過場；驗證：`tests/radial-menu.test.ts` 斷言延遲隨索引遞增，`tests/mobile-compatibility.test.ts` 斷言樣式表含減少動態區塊。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 說明選單不會叫出鍵盤且會避開鍵盤區域；同步四個版本檔為 `1.14.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含可視區域計算、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 1.14.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機在畫面下方的長按與動畫手感由使用者驗收。
