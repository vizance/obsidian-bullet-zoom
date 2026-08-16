## Problem

1. 手機上拖移大綱項目時，大綱面板會同時跟著手指捲動，畫面滑來滑去，很難放到正確位置。
2. 拆分成新筆記時，新檔一律建在目前筆記的資料夾，無法指定固定位置。
3. 拆分視窗的名稱欄是空的，使用者得自己重打一次 Bullet 的內容。

## Root Cause

1. 拖移只在 `pointermove` 呼叫 `preventDefault`，但手機的捲動由瀏覽器的觸控手勢直接驅動；大綱 body 沒有在拖移期間關閉 `touch-action`，原生捲動照跑。既有的 `touch-action: none` 只掛在拖移中的列上，面板本身仍可捲。
2. 拆分未提供資料夾設定，路徑固定取自目前筆記的 parent。
3. Modal 開啟時沒有帶入預設值。

## Proposed Solution

1. 拖移開始時在大綱 body 掛 `bullet-zoom-outline-dragging` 並以 CSS 把該容器的 `touch-action` 設為 `none`、`overflow` 設為 `hidden`，同時記住當下 scrollTop 並在拖移期間維持；拖移結束移除 class 並還原捲動位置，讓面板在拖移過程中完全不動。
2. 設定新增 `extractFolder`（字串，預設空字串＝與目前筆記同資料夾）與設定頁文字輸入欄；拆分時若有設定值則以該資料夾為基準，資料夾不存在時先建立，建立失敗以 Notice 提示並中止。
3. 開啟拆分視窗時，名稱欄預設帶入該 Bullet 的文字（去除首尾空白、移除 Markdown 連結語法與檔名不合法字元），並全選方便直接覆寫。

## Non-Goals

- 不提供資料夾選擇器 UI（以文字路徑輸入為主）。
- 不改變拆分後留下 wiki 連結 Bullet 的行為。
- 不改動桌面拖移的啟動距離與手機長按時間。

## Success Criteria

- 手機拖移期間大綱面板不捲動，放開後捲動位置與拖移前一致。
- 設定填入資料夾路徑後，新筆記建立在該資料夾；留空時維持同資料夾行為。
- 拆分視窗開啟時名稱欄已帶入該 Bullet 文字且為全選狀態。
- `npm test`、`npm run lint`、`npm run build` 全數通過；發布 0.1.45 供 BRAT 驗收。

## Impact

- Affected specs: `openspec/specs/bullet-outline-switcher/spec.md`, `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `src/list-structure.ts`
  - Modified: `src/main.ts`
  - Modified: `src/settings.ts`
  - Modified: `styles.css`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
