## Summary

拆分後原筆記留下什麼可自行選擇：連結、嵌入或不留任何內容，做法比照 Obsidian 官方 Note Composer 的 replacement 設定。

## Motivation

目前拆分一律在原位置留下 `- [[新筆記]]`。有些情境希望直接在原筆記看到新筆記的內容（嵌入），有些則希望原筆記完全清乾淨。Note Composer 用一個 replacement 選項涵蓋這三種需求，這裡沿用同一套心智模型。

## Proposed Solution

- 設定新增 `extractReplacement`，值為 `link`（預設）、`embed`、`none`，以下拉選單呈現於 `Extract to new note` 區塊，標籤 `Replacement text`，選項文字為 `Link to the new note`、`Embed the new note`、`Nothing`。
- 拆分時依設定產生替換內容：`link` 為 `- [[名稱]]`、`embed` 為 `- ![[名稱]]`，皆保留原縮排；`none` 則整段分支連同其換行一併刪除。
- 純邏輯層：`list-structure.ts` 新增 `planBulletRemovalRange(state, replaceFrom, replaceTo)`，在 `none` 模式回傳含換行的刪除範圍——分支後方有換行時吃掉後方換行，位於文件結尾時改吃前方換行，整份文件僅此分支時回傳原範圍，避免留下空行破壞清單結構與大綱渲染。
- 設定值為未知字串或缺漏時正規化為 `link`。

## Non-Goals

- 不支援自訂替換文字樣板。
- 不改動模板、目的資料夾、移除最上層 Bullet 等既有拆分設定。
- 不提供每次拆分時臨時切換替換方式。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/obsidian-mock.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
