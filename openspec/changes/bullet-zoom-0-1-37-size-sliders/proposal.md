## Summary

新增外掛設定頁，提供兩條滑桿分別調整「聚焦頁標題字級」與「Bullet 大綱字級」，調整即時生效並跨裝置記憶。

## Motivation

聚焦頁標題目前固定用 inline-title 字級（手機為 clamp 自適應），Bullet 大綱字級也是寫死的 UI 字級。不同使用者對「一個畫面要看到多少字」偏好不同，使用者希望能自己微調大小，而不是接受固定值。

## Proposed Solution

- 新增外掛設定（loadData／saveData 持久化）：`titleScale` 與 `outlineScale`，皆為百分比整數，範圍 60–160、間距 5、預設 100。
- 新增 PluginSettingTab，含兩條滑桿（顯示目前百分比、可即時拖動），變更時儲存並立即套用。
- 套用機制：外掛把 `--bullet-zoom-title-scale` 與 `--bullet-zoom-outline-scale`（百分比換算為倍率）寫到 document.body 的 style；`styles.css` 將聚焦標題（桌面與手機 clamp 兩處）與大綱字級改為乘上對應倍率的 calc 值。停用外掛時移除變數，回到預設大小。
- 讀入設定時做正規化：非數字或超界值回落到預設或夾在範圍內。

## Non-Goals

- 不提供字型、行高、粗細等其他排版選項。
- 不做每個筆記各自獨立的字級記憶。
- 不改動編輯器本文與麵包屑的字級。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - New: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - New: `tests/settings.test.ts`
  - Modified: `tests/mobile-compatibility.test.ts`
  - Modified: `tests/obsidian-mock.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
