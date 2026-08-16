## Summary

Bullet 大綱支援滑鼠與觸控拖移：拖動大綱上的項目到新位置，Markdown 檔中對應的 Bullet 連同其縮排子樹一起搬移。

## Motivation

大綱目前只能看與 Zoom，重排 Bullet 要回編輯器手動剪貼，手機上幾乎做不到。拖移是 Workflowy 等大綱軟體的核心操作，補上後大綱從導覽工具升級為整理工具。

## Proposed Solution

- 文件操作層：`list-structure.ts` 新增 `planBranchMove(state, sourceAnchor, targetAnchor, placement)`：取出來源 Bullet 的整段分支（含所有子行），依目標 Bullet 的縮排重排前綴後，插入目標分支之前（before）或之後（after），回傳一組 CodeMirror changes；禁止移到自己或自己的子孫底下（回傳 null）。縮排重排以「移除來源基底縮排前綴、補上目標縮排前綴」處理，子樹內部相對層級不變。
- 協調層：coordinator 新增 `moveBranch` 動作，驗證 revision 與 anchor 後 dispatch changes；文件變更後大綱沿既有機制自動重繪。
- 大綱 UI：列上以 pointer 事件實作拖移——滑鼠移動超過閾值即開始拖、觸控長按約 350ms 後開始拖；拖動中在目標列上/下顯示插入指示線，放開即執行搬移；拖移後抑制該次點擊避免誤觸 Zoom；Escape 或 pointercancel 取消。
- 放置語意：放在目標列上緣＝成為目標的前一個同層兄弟、下緣＝後一個同層兄弟（採目標的縮排層級）。

## Non-Goals

- 不支援拖動時以水平位移改變層級（升降階另案處理）。
- 不支援跨筆記拖移。
- 不支援多選拖移。
- jsdom 無法模擬完整拖移手勢，手勢體驗以實機驗收為準；自動測試涵蓋文件操作與協調層。

## Impact

- Affected specs: `openspec/specs/bullet-outline-switcher/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `styles.css`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
