## Problem

公開 repo 的資深 review 找到三件事：

1. 拆分筆記時，使用者輸入的檔名只有 `trim()`，沒有清洗。輸入 `../筆記` 或 `資料夾/名稱` 會直接被接進路徑，往預期以外的位置寫檔。同一份清洗邏輯其實已經存在，卻只套用在「預設帶入的名稱」，使用者手打的反而沒過。
2. `tests/probe.test.ts` 是除錯時留下的探針，只印 `console.log`、不驗證任何行為，卻佔了 lint 九個 error 中的五個。
3. 剪貼簿退路與強制關閉預覽視窗都直接寫 inline style，是 Obsidian 外掛審查會擋的寫法，也讓佈景無法覆寫。

## Proposed Solution

- 把既有的檔名清洗抽成單一函式，拆分時對使用者輸入的名稱也套用：移除路徑分隔字元與 Obsidian 不接受的字元，並在清洗後為空時中止並說明。
- 刪除探針測試。
- 剪貼簿退路的暫存 textarea 與強制關閉改用樣式表類別，不再寫 inline style。

## Non-Goals

- 不改變拆分的其他行為（模板、替代內容、開啟方式）。
- 不改變預覽視窗關閉的時機與次數保證。

## Success Criteria

- 輸入含路徑分隔字元的名稱時，檔案仍然建立在設定的資料夾內。
- 清洗後為空的名稱會被擋下並說明。
- `npm run lint` 沒有 error。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`, `openspec/specs/bullet-zoom-mobile-reliability/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/main.ts`
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `styles.css`
  - Removed: `tests/probe.test.ts`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
