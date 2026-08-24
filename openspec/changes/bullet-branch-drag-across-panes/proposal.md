## Why

Bullet Zoom 目前只能用命令與側邊欄調整大綱順序：側邊欄拖曳只支援同一份檔案、只有 before / after 兩種落點，而且不能改變階層。使用者在編輯器裡看著內容時，若要把一段分支搬到別的位置或別的檔案，必須手動剪下、切換 pane、貼上、再重排縮排，是整個外掛目前最耗手工的操作。

Workflowy、Logseq、Dynalist 都把「抓住項目符號拖曳」當成大綱工具的基本動作。Bullet Zoom 已經在編輯器裡替每個支援的清單標記加上 `.bullet-zoom-marker` 裝飾並綁定點擊 Zoom，握把已經存在，只差拖曳行為。

## What Changes

- 在編輯器內，支援的清單標記成為拖曳握把。滑鼠位移超過門檻、或觸控長按後開始拖曳；未超過門檻的放開仍然是既有的點擊 Zoom 行為。
- 拖曳的單位是整個分支（該項目與其所有子項目），沿用既有的 `computeBranchRange`。
- 落點由指標的垂直與水平位置共同決定：垂直位置決定插入在哪兩行之間，水平位置在該間隙的合法深度範圍內決定縮排層級，因此可以把分支拖成目標的子項目或拖回外層。
- 拖曳過程顯示一條落點指示線，指示線的左緣對齊即將採用的縮排欄位，放開前就能看到結果階層。
- 支援跨 pane：在同一個 Obsidian 視窗內，可以從一個編輯器把分支拖到另一個分割 pane 的編輯器，包含拖到不同檔案。跨檔案時來源檔刪除分支、目標檔插入分支，兩份檔案各自產生一次 undo。
- 條列與編號清單一視同仁：能不能拖曳完全跟隨既有的標記辨識設定（`markerDetectionFacet` 的 `bullets` 與 `numbered`，對應設定畫面的 Zoom numbered items）。不新增開關。
- 落地時分支的標記樣式改採目標清單的樣式，編號清單重新編號。這段改寫邏輯從既有的 `planListPaste` 抽成共用函式，貼上與拖曳共用同一條程式路徑。

## Capabilities

### New Capabilities

- `bullet-branch-drag`: 在編輯器內以標記為握把拖曳整個分支，含以水平位移決定落點階層、跨 pane 與跨檔案搬移、標記樣式與編號改寫、以及拒絕非法落點的規則。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `bullet-branch-drag`
- Affected code:
  - New:
    - `src/branch-drop-plan.ts`
    - `src/branch-drag-controller.ts`
    - `tests/branch-drop-plan.test.ts`
    - `tests/branch-drag-controller.test.ts`
  - Modified:
    - `src/list-structure.ts`
    - `src/focus-extension.ts`
    - `src/main.ts`
    - `styles.css`
    - `tests/mobile-compatibility.test.ts`
  - Removed: （無）
