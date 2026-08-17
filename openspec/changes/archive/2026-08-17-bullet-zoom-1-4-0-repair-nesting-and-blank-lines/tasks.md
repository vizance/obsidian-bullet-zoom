## 1. 縮排基準與空行

- [x] 1.1 實作 **Keep stray lines visible and repair them automatically** 的新縮排規則：`src/list-structure.ts` 的 `planFocusStructureRepair` 掃描時追蹤「最近一個合法清單項目」的縮排文字（初始為聚焦 Bullet 本身），需要修正的行以該項目的下一層縮排為準，同一個連續待修區塊共用同一個縮排值，遇到未被修改的合法清單項目時更新基準；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的「接續上一個 Bullet」「聚焦 Bullet 之下」「混合區塊」三個 Example。
- [x] 1.2 實作空行移除：修復輸出略過區塊內的空行，僅輸出修正後的清單行；若區塊內全為空行則不產生交易；驗證：`tests/list-structure.test.ts` 斷言多段口述含空行修復後為連續 Bullet，且純空行區塊回傳 null。
- [x] 1.3 同步既有測試與觸發流程：更新 `tests/focus-extension.test.ts` 的口述情境預期輸出為連續且縮到前一個 Bullet 之下的結果，確認 debounce、獨立 undo 與關閉設定的行為不變；驗證：`npm test` 全數通過。
- [x] 1.4 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 文件、版本與發布

- [x] 2.1 更新 `README.md` 與 `README.zh-TW.md` 的自動修復說明（縮到前一個 Bullet 之下、彼此平輩、移除空行）；同步四個版本檔為 `1.4.0`、更新版本斷言；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含新縮排規則、無 Node.js 或 Electron runtime import。
- [x] 2.3 commit 推送 main，release guard preflight（`--version 1.4.0`）通過後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全；實機 Typeless 口述流程由使用者驗收。
