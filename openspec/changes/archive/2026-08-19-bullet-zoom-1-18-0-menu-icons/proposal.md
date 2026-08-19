## Problem

在 iPad 上打開 Bullet 選單時，每一格的圖示小到看不清楚：按鈕沿用手機的 48px 尺寸，圖示本身又只有 Obsidian 的預設字級，在平板較大的畫面與較遠的視距下幾乎無法辨識。另外八格在半徑 104px 的扇形上排列時，相鄰兩格的弧長只有約 46px，比按鈕本身還小，格子會互相重疊。

同時，每一格目前只能選指令，圖示是從指令自帶的 icon 推導出來的。很多指令沒有 icon（退回預設的圓點），或它的 icon 和使用者對這一格的認知不同，使用者無法自己指定。

## Proposed Solution

- 依裝置決定選單的尺寸：平板使用放大的按鈕、圖示、扇形半徑與命中半徑，手機維持現有尺寸。尺寸以 CSS 變數寫在覆蓋層上，樣式表只讀變數。
- 圖示大小獨立於按鈕大小設定，讓圖示在按鈕內佔到合理比例，不再沿用 Obsidian 的預設字級。
- 扇形半徑改為至少能讓相鄰兩格不重疊：依格子數與按鈕尺寸推算需要的半徑，取它與基準半徑的較大值。
- 每一個插槽新增可選的圖示欄位，輸入 Obsidian 圖示 ID 並提供自動完成與即時預覽。留空時沿用指令自帶的圖示，指令沒有圖示時才退回預設圓點。

## Non-Goals

- 不改變選單的開啟方式、手勢、動畫與取消行為。
- 不在桌面版啟用選單。
- 不自製圖示，只使用 Obsidian 內建的圖示集。

## Success Criteria

- 平板上的按鈕與圖示明顯放大，八格全開時彼此不重疊。
- 手機上的尺寸與 1.17.1 相同。
- 每一格可以指定圖示 ID，選單依設定顯示；留空時行為與現在一致。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/radial-menu.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/radial-menu.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
