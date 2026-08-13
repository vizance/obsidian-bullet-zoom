# Contributing to Bullet Zoom

感謝你協助改善 Bullet Zoom。

## Repository 結構

- `src/`：TypeScript 原始碼。
- `tests/`：Vitest 回歸測試，涵蓋桌面、手機、平板、fold、breadcrumb、側邊欄與設定。
- `main.js`：由 TypeScript 建置產生的 Obsidian runtime bundle。
- `manifest.json`：Obsidian 插件資訊與版本。
- `styles.css`：插件樣式。

`src/` 與 `tests/` 留在 GitHub，是為了讓維護者與使用者能檢查實作並確認行為有測試保護。它們不會被 BRAT 安裝到 Vault。

## 安裝包邊界

GitHub Release workflow 只上傳以下三個檔案：

- `main.js`
- `manifest.json`
- `styles.css`

BRAT 與手動安裝都只使用這三個檔案。Repository 內的 TypeScript、測試、設定檔與開發依賴不會進入 Vault 的插件資料夾。

## 本機驗證

需要 Node.js 與 npm。安裝依賴後執行：

```bash
npm ci
npm test -- --run
npm run lint -- --max-warnings=0
npm run build
git diff --check
```

`npm run build` 會先執行 TypeScript 檢查，再重新產生 `main.js`。

## Pull Request

Pull Request 應清楚說明：

- 使用者遇到的問題或想改善的操作。
- 修改後可觀察到的行為。
- 已執行的測試與人工驗證。
- 尚未驗證的裝置或情境，尤其是實體 iPhone 與 iPad。

不要把桌面測試或 jsdom 測試描述成實體手機驗收。

## Release Notes

README 只維護目前版本的使用方式。每個版本的新增功能、修正、驗證狀態與已知限制應寫入對應的 [GitHub Release Notes](https://github.com/vizance/obsidian-bullet-zoom/releases)。
