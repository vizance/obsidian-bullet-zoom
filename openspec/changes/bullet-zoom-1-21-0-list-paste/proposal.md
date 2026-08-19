## Problem

剪下一段 Bullet 之後貼上，貼進去的內容不會融入目標清單，使用者得手動整理兩件事：

1. 從編號清單剪下來的內容，貼進一般 Bullet 清單之後仍然是 `1.`、`2.`，要自己改成 `-`。
2. 子項目貼上後對齊到最外層，相對於新的父項目等於被 outdent，要自己逐行按 Tab 補回縮排。

原因是複製時分支被去掉共同縮排（這樣才能貼到任何深度），但貼上時沒有人把它接回目標行的縮排與標記樣式。

## Proposed Solution

- 攔截編輯器的貼上事件：當剪貼簿內容是一段清單、而且游標停在清單行上時，改由外掛決定插入內容。
- 以目標行的縮排為基準重寫每一行，保留每一行相對於分支根的深度，讓子項目仍然掛在貼上的父項目底下。
- 每一行的標記改採目標清單的樣式：目標是 `-`、`*`、`+` 就沿用該符號，目標是編號清單就依層級重新編號。
- 貼進一個空的清單項目時，直接填滿那一行，而不是在分支上方留一個空標記。
- 新增設定可以關掉這個行為，關掉後貼上完全交還 Obsidian。

## Non-Goals

- 不處理非清單內容的貼上，也不處理有選取範圍的貼上。
- 不改變剪貼簿裡的內容，只改變寫進筆記的形狀。
- 不碰 Obsidian 原生的清單自動編號行為。

## Success Criteria

- 從編號清單剪下的分支貼進 Bullet 清單後全部變成 Bullet。
- 子項目貼上後仍然比父項目深一層，不需要手動 Tab。
- 關閉設定後，貼上行為與 Obsidian 預設一致。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
