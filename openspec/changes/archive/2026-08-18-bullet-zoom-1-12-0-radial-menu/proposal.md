## Summary

長按 Bullet 圓點叫出徑向選單，每一格綁定一個 Obsidian 指令，讓常用的 Bullet 操作在手機上一個手勢完成；僅在手機與平板啟用。

## Motivation

手機上要對某個 Bullet 做事（複製、刪除、加前綴）目前得先移動游標、再開指令面板，步驟多且容易點錯。橫向滑動已證實無法與原生手勢共存，長按則是完全屬於外掛的通道：圓點是外掛已經精確掌握的觸控目標，長按不會與捲動、選字或抽屜競爭。以指令 ID 綁定每一格，延展性最大，使用者可放入第三方外掛的指令。

## Proposed Solution

- **新增三個 Bullet 指令**：`Copy bullet`（依設定複製該行文字或整段分支）、`Delete bullet`（刪除整段分支並移除多餘換行）、`Insert prefix text`（在標記後插入或移除設定的前綴），皆以游標所在 Bullet 為對象，沿用既有的 `collectBulletCopyText`、`planBulletRemovalRange` 與 `planBulletPrefixToggle`。這三個指令本身在桌面也可用。
- **長按判定**：圓點的 `pointerdown` 不再立即 Zoom，改為記錄起點並啟動計時器。計時器到期且手指未離開且位移未超過門檻時開啟選單；在計時器到期前放開則執行 Zoom；位移超過門檻或 `pointercancel` 則全部取消，還原為原生行為。桌面滑鼠維持按下即 Zoom 的行為。
- **選單呈現**：以覆蓋層在觸控點附近置中繪製圓形選單，最多八格加中央取消鍵，每格顯示指令名稱縮寫與圖示。手指未離開時可滑向某格再放開即選取；已放開時可直接點選。點中央、點選單外或按 Escape 取消。
- **執行方式**：選取後先把編輯器游標移到該 Bullet，再以 `app.commands.executeCommandById` 執行綁定的指令，因此任何依游標運作的指令都能使用。
- **設定**：新增 `Radial menu` 區塊，含啟用開關（預設開啟、僅行動裝置生效）、長按毫秒數（250 至 1000、預設 450）與八個插槽的指令選擇；插槽預設依序為複製、刪除、加前綴、Zoom、拆分成新筆記，其餘留空。

## Non-Goals

- 不在桌面版啟用長按選單。
- 不支援每個插槽自訂圖示或顏色。
- 不支援巢狀選單或超過八格。
- 不改變摺疊區與內容區的既有行為。

## Impact

- Affected specs: `openspec/specs/bullet-zoom-mobile-reliability/spec.md`, `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - New: `src/radial-menu.ts`
  - Modified: `src/focus-extension.ts`
  - Modified: `src/list-structure.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - New: `tests/radial-menu.test.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
