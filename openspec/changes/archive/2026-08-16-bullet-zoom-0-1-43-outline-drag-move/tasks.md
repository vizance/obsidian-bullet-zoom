## 1. 拖移

- [x] 1.1 實作 **Move a branch by dragging its outline row** 的文件操作層：`src/list-structure.ts` 新增 `planBranchMove(state, sourceAnchor, targetAnchor, placement)`，以 `computeBranchRange` 取來源與目標分支、以「去除來源基底縮排前綴＋補上目標縮排前綴」重排子樹縮排、產生刪除與插入的 changes；目標為自己或子孫時回傳 null；驗證：`tests/list-structure.test.ts` 覆蓋 spec 三個 Example（after 重排、before 換層、子孫拒絕）與尾行無換行結尾的文件。
- [x] 1.2 接上協調層：coordinator 新增 `moveBranch(sourceAnchor, targetAnchor, placement, revision)`，驗證 revision／anchor 後 dispatch changes 並觸發 refresh；outline actions 增加 `onMove`；驗證：`tests/outline-sidebar-view.test.ts` 以 coordinator fixture 斷言合法搬移改變文件、revision 過期與子孫目標不改變文件。
- [x] 1.3 實作大綱 UI 拖移手勢：列（label 區）掛 pointerdown／pointermove／pointerup／pointercancel——滑鼠位移超過 8px 或觸控長按 350ms 開始拖，拖動中以 elementFromPoint 找目標列並在其上／下顯示 `bullet-zoom-outline-drop-indicator` 插入線（jsdom 無 elementFromPoint 時安全跳過），放開呼叫 `onMove`，拖移完成後抑制該次 click；`styles.css` 加指示線與拖動中列的樣式；驗證：`tests/outline-sidebar-view.test.ts` 斷言拖移後的合成 click 不觸發 Zoom（旗標行為），指示線元素於拖動結束後清除。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.43`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含 planBranchMove 與拖移手勢、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 0.1.43`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機拖移手感由使用者驗收。
