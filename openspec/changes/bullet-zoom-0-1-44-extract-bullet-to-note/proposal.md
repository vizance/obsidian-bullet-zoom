## Summary

新增「拆分 Bullet 成新筆記」指令：游標停在某個 Bullet 上時執行，輸入檔名後把該 Bullet 的內容移動到新建的 Markdown 檔，原位置換成指向新筆記的連結 Bullet；新檔預設移除最上層 Bullet（可在設定切換）。

## Motivation

使用者常在 daily note 裡發展出一整叢值得獨立成筆記的 Bullet 內容，目前要手動剪貼、建檔、修縮排。做成指令後一步完成，並確保拆分後原筆記的清單結構與 Bullet 大綱不會壞掉。

## Proposed Solution

- 文件操作層：`list-structure.ts` 新增 `planBulletExtract(state, anchor, removeTopBullet)`，回傳（原文替換範圍與替換文字、新檔內容）：
  - 新檔內容——removeTopBullet 為真：捨棄最上層 Bullet 行，取其子行並以子行間最小共同前綴縮排歸零，子樹相對層級不變；無子行時以該 Bullet 的文字作為內容。為假：整段分支以來源縮排歸零收錄。
  - 原文替換——整段分支替換為同縮排的 `- [[檔名]]` 連結 Bullet，保持清單結構完整，大綱重繪不會壞掉。
- 指令層：`main.ts` 新增 editorCheckCallback 指令「拆分 Bullet 成新筆記」，游標所在行不是支援的 Bullet 時不可用；執行時開啟輸入視窗（檔名欄＋確定／取消），確認後在目前筆記同資料夾以 `vault.create` 建立 `檔名.md`；檔名為空或已存在時以 Notice 提示並中止，不改動原文。
- 設定：新增 `extractRemoveTopBullet`（預設 true）與設定頁 toggle「拆分時移除最上層 Bullet」。

## Non-Goals

- 不提供資料夾選擇（固定與目前筆記同資料夾）。
- 不處理跨筆記合併或反向「併回」操作。
- 不自訂連結格式（固定 `[[檔名]]` wiki link）。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/obsidian-mock.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
