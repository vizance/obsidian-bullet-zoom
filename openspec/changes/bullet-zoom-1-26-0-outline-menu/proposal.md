## Problem

Bullet 選單只能從編輯器裡的圓點開啟。在大綱面板瀏覽時，看到某一列想對它做事（複製、剪下、拆分、加前綴），得先 Zoom 進去或回編輯器找到那一行，多繞一圈。

## Proposed Solution

- 大綱每一列前面的階層編號改成可點擊，點它為那一列的 Bullet 開啟選單；點文字維持 Zoom，兩個動作分開，和編輯器裡「圓點開選單、文字 Zoom」一致。
- 不使用長按，因為大綱的長按已經是拖移排序。
- 新增設定控制這個行為，預設開啟；設定放在 `Bullet menu` 區塊，只有選單本身可開啟時才出現。
- 選單開在被點的編號上，作用對象是那一列對應的文件位置。

## Non-Goals

- 不改變大綱的 Zoom、展開收合與拖移排序。
- 不改變選單本身的版面、尺寸與插槽設定。

## Success Criteria

- 設定開啟時，點大綱列的編號會開啟該 Bullet 的選單。
- 設定關閉時，編號回到純顯示，不可點擊。
- 點文字仍然只做 Zoom。

## Impact

- Affected specs: `openspec/specs/bullet-outline-switcher/spec.md`
- Affected code:
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `styles.css`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
