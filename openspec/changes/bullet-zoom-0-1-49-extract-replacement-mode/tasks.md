## 1. 替換方式

- [x] 1.1 實作 **Choose what replaces the extracted bullet** 的刪除範圍計算：`src/list-structure.ts` 新增 `planBulletRemovalRange(state, replaceFrom, replaceTo)`，分支後有換行時把 `to` 加一、分支結束於文件尾且前方有換行時把 `from` 減一、整份文件僅此分支時維持原範圍；驗證：`tests/list-structure.test.ts` 覆蓋 spec 的中段刪除與結尾刪除兩個 Example 與單一分支文件。
- [x] 1.2 實作設定與拆分套用：`src/settings.ts` 新增 `extractReplacement`（`link`／`embed`／`none`，未知值正規化為 `link`）；`src/main.ts` 在 `Extract to new note` 區塊加入 `Replacement text` 下拉（選項 `Link to the new note`／`Embed the new note`／`Nothing`），拆分成功後依設定 dispatch：`link` 插入 `${indent}- [[name]]`、`embed` 插入 `${indent}- ![[name]]`、`none` 以 `planBulletRemovalRange` 刪除範圍且不插入文字；`tests/obsidian-mock.ts` 補 `DropdownComponent` mock（addOption／setValue／onChange）；驗證：`tests/settings.test.ts` 斷言預設值與未知值正規化，`npm run build` 無型別錯誤。
- [x] 1.3 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。

## 2. 版本與發布

- [x] 2.1 同步四個版本檔為 `0.1.49`、更新版本斷言、`README.md` 補版本紀錄；驗證：版本一致、`npm test` 通過。
- [x] 2.2 `npm run build` 產生 `main.js`；驗證：bundle 含三種替換模式、無 Node.js 或 Electron runtime import。
- [ ] 2.3 commit 推送 main，release guard preflight（`--version 0.1.49`）通過後建 tag 與 GitHub Release 附三資產；驗證：資產齊全；實機三種替換模式由使用者驗收。
