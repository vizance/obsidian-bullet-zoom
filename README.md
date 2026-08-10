# Bullet Zoom

Bullet Zoom 是一款 Obsidian 插件，讓你在即時預覽模式裡聚焦某一個普通 Bullet Point，繼續編輯該節點與它的所有子節點。聚焦只改變目前編輯窗格的顯示範圍，不會改寫或刪除 Markdown 原文。

## 目前狀態

- 目前開發版本：`0.1.4`（修正實體 iPhone 頂端路徑遮擋）
- 目前公開 BRAT 版本：`0.1.4`
- 最低 Obsidian 版本：`1.11.7`
- 桌面版人工驗收：已通過 Obsidian `1.13.5`
- 手機版自動驗收：`0.1.4` 已加入 Bullet Zoom panel 搬離 sticky wrapper 的 DOM 回歸測試
- 實體手機驗收：`0.1.3` 未通過；鍵盤開啟時路徑仍遮住狀態列、Dynamic Island 與 Obsidian view header。`0.1.4` 發佈後待重新複驗
- 正式 Vault：已安裝並啟用 `0.1.1`，桌面命令已確認

## 支援範圍

第一版只支援 Obsidian 的即時預覽模式，以及下列普通無序清單：

```markdown
- 第一種 Bullet
* 第二種 Bullet
+ 第三種 Bullet
```

目前不支援：

- 編號清單
- Task List
- Source Mode
- Reading View
- Heading 聚焦
- 儲存或同步上次的聚焦狀態

## 使用方式

你可以用兩種方式進入聚焦：

1. 點擊或輕觸普通 Bullet 的圓點。
2. 把游標放在普通 Bullet 內，執行命令 `Bullet Zoom: 聚焦目前的 Bullet Point`。

聚焦後，桌面版的上方路徑會顯示筆記名稱、所有父節點和目前節點。手機版從 `0.1.2` 起改成單列，只顯示「全文」、最近一層父節點與目前節點；點擊父節點可逐層返回，點擊「全文」或執行 `Bullet Zoom: 退出 Bullet 聚焦`，可回到完整筆記。

`0.1.3` 起可執行 `Bullet Zoom: 回到上一層 Bullet`，一次只回到目前節點的直屬父 Bullet。請到「設定 → 快捷鍵」搜尋 `回到上一層 Bullet`，再依目前 Vault 的快捷鍵配置指定按法。連續執行會逐層返回；目前已在最外層 Bullet 時，再執行一次會回到完整筆記。若要不經過父層、直接回到完整筆記，仍可執行 `Bullet Zoom: 退出 Bullet 聚焦`。

手機聚焦時會暫時隱藏目前窗格的 inline title 與 Properties，讓目標 Bullet 緊接在路徑下方。退出聚焦後，標題與 Properties 會立即恢復。

`0.1.4` 起，手機會把 Bullet Zoom 自己的路徑移出 CodeMirror 的 sticky top panel，放到編輯區前方的正常排列裡。Obsidian 或其他插件的 top panel 不會被一起移動。軟體鍵盤開啟時，路徑應維持在 iOS 狀態區與 Obsidian view header 下方，不再移到 Dynamic Island 後面。

路徑最右側是目前所在層級。`0.1.1` 起會使用目前 Obsidian 主題的強調色標示，其他父層維持中性色；這個狀態也會透過 `aria-current="location"` 提供給輔助科技。

插件不預設占用快捷鍵，避免和 Outliner 的移動節點命令或其他 Vault 設定衝突。桌面版可自行替命令指定快捷鍵；手機版可把「回到上一層 Bullet」與「退出 Bullet 聚焦」加入 Mobile Toolbar，使用外接鍵盤時也會套用該 Vault 的自訂組合。

## 安裝

### 使用 BRAT 安裝（建議）

1. 在 Obsidian 安裝並啟用 BRAT。
2. 開啟命令面板，執行 `BRAT: Plugins: Add a beta plugin for testing (with or without version)`。
3. 輸入 `vizance/obsidian-bullet-zoom`，選擇安裝最新版本。
4. 安裝完成後，到「設定 → 第三方插件」重新載入插件清單並啟用 Bullet Zoom。

BRAT 會從 GitHub Release 下載下列三個檔案，之後也可以用 BRAT 的更新命令取得新版：

- `main.js`
- `manifest.json`
- `styles.css`

桌面版和手機版都使用同一個 repo。若手機的 Vault 已透過 Obsidian Sync 同步設定，也可以直接在手機的 BRAT 加入同一個路徑。GitHub Release `0.1.4` 已發佈，BRAT 現在可以更新；實體手機更新與複驗完成前，不宣稱手機 UX 已正式通過。

### 手動安裝（備用）

從最新的 GitHub Release 下載 `main.js`、`manifest.json`、`styles.css`，放進 Vault 的 `.obsidian/plugins/bullet-zoom/`，再到「設定 → 第三方插件」啟用 Bullet Zoom。

正式 Vault 已在 2026-08-10 以三檔安裝包完成初次安裝與桌面啟用；後續版本改由 BRAT 管理即可。

## 安全訊息

插件遇到不支援的情境時會保留原文並顯示下列訊息：

- Source Mode：`Bullet Zoom 第一版只支援即時預覽模式。`
- 游標不在普通 Bullet：`請先把游標放在一般 Bullet Point 裡。`
- 無法取得編輯器：`無法取得目前的 Obsidian 編輯畫面。`

若編輯動作讓目前節點失效，插件會自動退出聚焦，並保留使用者剛才的修改。

## 驗證紀錄

### 自動驗證

2026-08-09 完成：

- `npm test`：53 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- 安裝包：`main.js`、`manifest.json`、`styles.css` 均存在
- Runtime bundle：未包含 Node.js 或 Electron import

2026-08-10 完成 `0.1.1` 驗證：

- `npm test`：54 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.1`
- 測試 Vault 內的 `main.js`、`manifest.json`、`styles.css` 與建置來源逐檔一致
- Breadcrumb DOM：只有最右側按鈕具有 `is-current` 與 `aria-current="location"`

2026-08-10 完成 `0.1.2` 開發版驗證：

- `npm test`：58 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.2`
- 測試 Vault 內的 `main.js`、`manifest.json`、`styles.css` 與建置來源逐檔一致
- 手機 Breadcrumb DOM：保留完整可存取路徑，但視覺上只顯示「全文」、最近父層與目前節點
- 聚焦窗格狀態：進入、失效、退出與 view destroy 的 class 切換測試通過，其他分割窗格不受影響
- Obsidian Properties 核心樣式衝突已加入回歸驗證，隱藏規則只限手機的目前聚焦窗格
- GitHub Release `0.1.2`：`main.js`、`manifest.json`、`styles.css` 三個遠端 asset 均存在，下載後的 SHA-256 與 canonical 建置逐檔一致

2026-08-10 完成 `0.1.3` 驗證與發佈：

- `npm test`：65 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- 三層節點可透過 `bullet-zoom-focus-parent` 一次只返回一層，最外層再執行時回到全文
- 命令顯示名稱與「不提供預設 hotkey」已由測試固定，避免和 Outliner 的上移節點快捷鍵衝突；原有 `bullet-zoom-exit` 保留
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.3`
- 建置後的 `main.js` 已包含新命令，且未新增 Node.js 或 Electron runtime import
- GitHub Release `0.1.3`：`main.js`、`manifest.json`、`styles.css` 三個遠端 asset 均存在，下載後的 SHA-256 與 canonical 建置逐檔一致

2026-08-10 完成 `0.1.4` 本機候選版驗證：

- 實體 iPhone 截圖確認 `0.1.3` 未修正頂端遮擋：CodeMirror top panel 的 sticky 定位會在軟體鍵盤改變 visual viewport 時，把路徑黏到狀態列、Dynamic Island 與 Obsidian view header 上方
- 回歸測試先確認未修正時 Breadcrumb 仍留在共享 sticky wrapper 而失敗，再確認 `.is-phone` 只把 Bullet Zoom Breadcrumb 移到 `EditorView.scrollDOM` 前方；共存及聚焦後動態開／關的其他 top panel 留在原 wrapper，桌面 Breadcrumb 也維持 CodeMirror baseline
- `npm test`：68 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.4`
- standalone commit `79b2f0a` 已建立 GitHub Release `0.1.4`；Actions Release workflow 通過，遠端 `main.js`、`manifest.json`、`styles.css` 的 SHA-256 與 canonical build 逐檔一致
- 實體 iPhone 仍待透過 BRAT 更新 `0.1.4` 後複驗

### 桌面版人工驗收

環境：macOS、Obsidian `1.13.5`、專用 `.test-vault`、即時預覽模式。

| 檢查項目 | 結果 | 實際觀察 |
| --- | --- | --- |
| 點擊 Bullet 進入聚焦 | 通過 | 點擊 `Parent A` 圓點後，只顯示該節點與完整子分支 |
| 命令面板進入聚焦 | 通過 | 從游標所在節點執行命令後正確聚焦 |
| 巢狀節點再次聚焦 | 通過 | 從 `Parent A` 再聚焦 `Child A1`，顯示範圍正確縮小 |
| 聚焦中編輯 | 通過 | 可在 continuation line 正常輸入文字 |
| Undo | 通過 | Obsidian Undo 正常還原剛才的文字，隱藏內容未受影響 |
| 完整 Breadcrumb | 通過 | 深層節點顯示筆記、Parent、Child、目前節點 |
| Breadcrumb 回到父節點 | 通過 | 點擊 `Parent A` 後正確放大為父分支 |
| Breadcrumb 回到完整筆記 | 通過 | 點擊筆記名稱後面板消失，完整筆記恢復 |
| 左右分割窗格 | 通過 | 右側聚焦時，左側同一筆記仍維持完整且獨立 |
| 切換筆記 | 通過 | 聚焦中的窗格開啟 `Other Note` 後自動清除聚焦，返回原筆記也是完整內容 |
| 明確退出命令 | 通過 | 執行退出命令後恢復完整筆記與原游標位置 |
| Source Mode 阻擋 | 通過 | 原文與狀態不變，顯示指定的即時預覽提示 |
| 插件重新載入 | 通過 | 暫時聚焦狀態清除，完整筆記恢復 |
| Markdown 原文完整性 | 通過 | 測試後檔案仍為 213 characters，含完整清單、段落、Task 與編號項目 |

### 手機版驗收

- `0.1.2` 窄螢幕模擬：已通過
- `0.1.1` 實體手機：未通過；完整橫向路徑、inline title 與 Properties 會占用上方畫面
- `0.1.3` 實體 iPhone：未通過；鍵盤開啟時 Breadcrumb top panel 遮住狀態列、Dynamic Island 與 Obsidian view header
- `0.1.4` BRAT Release：已發佈且三個 asset 與 canonical build 一致；待使用者在實體 iPhone 更新後複驗

#### `0.1.4` 手機頂端定位回歸紀錄

測試在同一個 CodeMirror editor 同時建立 Bullet Zoom Breadcrumb 與另一個 top panel，也涵蓋先聚焦、再動態開啟與關閉其他 panel 的順序。在 `.is-phone` 下，只有 Breadcrumb 會移到 `EditorView.scrollDOM` 前方；CodeMirror 重新同步後仍會回到這個位置，另一個 panel 留在 `.cm-panels-top`，不會被 Bullet Zoom 改變定位。桌面測試另確認 Breadcrumb 仍位於 `.cm-panels-top`。這是 panel 生命週期與 DOM 位置的自動測試，沒有模擬 iOS safe area、visual viewport 或鍵盤幾何位置；最終畫面仍須由使用者在實體 iPhone 更新後確認。

#### `0.1.2` 手機 UX 修正模擬紀錄

環境：macOS、Obsidian `1.13.5`、Developer Tools Responsive Mode、315 × 421 CSS px 可用 viewport（以縮短高度模擬軟體鍵盤佔位）、專用 `.test-vault`、含 inline title 與三個 Properties 的測試筆記。

| 檢查項目 | 結果 | 實際觀察 |
| --- | --- | --- |
| 單列導覽 | 通過 | 視覺上只顯示「全文」、`Child A1` 與目前節點 `Grandchild A1a`；更深祖先 `Parent A` 保留於 DOM，但不佔畫面 |
| 目前層級辨識 | 通過 | 只有 `Grandchild A1a` 維持強調色與 `is-current`；最近父層具有 `is-parent` |
| 觸控尺寸 | 通過 | 「全文」寬 44 px、列高至少 44 px；父層與目前節點分配剩餘空間 |
| 無水平捲動 | 通過 | Breadcrumb `overflow-x: hidden`，`clientWidth` 與 `scrollWidth` 均為 255 px |
| 標題與 Properties | 通過 | 聚焦時 inline title 與 `.metadata-container` 均為 `display: none`，目標 Bullet 緊接在導覽列下方 |
| 退出後恢復 | 通過 | 退出命令後 focused-pane class 與 Breadcrumb 移除，inline title 與 Properties 恢復為 `display: block` |

這個舊模擬只證明桌面 Obsidian 的窄 viewport 與手機 CSS 寬度行為。後續 `0.1.3` 實體 iPhone 截圖已證明它沒有涵蓋 CodeMirror sticky top panel、iOS visual viewport 與 safe area，因此不能代表手機實機通過。

#### `0.1.1` 舊窄螢幕模擬紀錄（歷史）

環境：macOS、Obsidian `1.13.5`、Developer Tools Responsive Mode、322 × 704 CSS px、專用 `.test-vault`。

下表是 `0.1.1` 發佈前的紀錄。後續實體手機截圖證明「可以水平滑動完整路徑」仍不足以讓鍵盤開啟時正常寫作，因此這份紀錄不再代表手機 UX 驗收通過。

| 檢查項目 | 結果 | 實際觀察 |
| --- | --- | --- |
| 輕觸 Bullet 進入聚焦 | 通過 | 在模擬裝置內輕觸 `Parent A` 圓點後顯示完整分支 |
| 命令面板入口 | 通過 | 可從行動版 Ribbon 開啟命令面板，兩個 Bullet Zoom 命令均可見 |
| 聚焦中輸入 | 通過 | continuation line 可輸入 ` mobile`，Undo 後恢復 213 characters |
| 長 Breadcrumb | 通過 | 四層路徑維持單一橫向區域，沒有換行或壓住編輯文字 |
| Breadcrumb 橫向滑動 | 通過 | 可從筆記名稱滑到 `Child A1` 與 `Grandchild A1a` |
| 祖先節點回焦 | 通過 | 輕觸 `Child A1` 後顯示範圍正確放大為該祖先分支 |
| 退出聚焦 | 通過 | 從行動版命令面板退出後，完整筆記與原文恢復 |
| 裁切與重疊 | 通過 | 322 px 寬度下，Breadcrumb、編輯區與底部狀態列沒有互相遮蓋；超寬路徑改以水平滑動存取 |

### `0.1.1` 目前層級顏色驗收

環境：macOS、Obsidian `1.13.5`、專用 `.test-vault`、深層路徑 `Bullet Zoom Manual Test › Parent A › Child A1 › Grandchild A1b`。

| 檢查項目 | 結果 | 實際觀察 |
| --- | --- | --- |
| 桌面強調色 | 通過 | 最右側目前層級顯示紫色強調底與白字，筆記名稱及父層維持中性灰色 |
| 目前位置語意 | 通過 | 只有 `Grandchild A1b` 具有 `is-current` 與 `aria-current="location"` |
| 322 × 704 顯示 | 通過 | 實際 viewport 為 322 × 704 CSS px；目前層級仍為強調色，按鈕維持至少 44 × 44 CSS px |
| 窄螢幕橫向存取 | 通過 | Breadcrumb 可視寬度 278 px、內容寬度 546 px、`overflow-x: auto`；滑至 268 px 後可完整看到目前層級 |
| 編輯區避讓 | 通過 | 編輯區位於 Breadcrumb 下方並延伸至 viewport 底部，聚焦中的 Bullet 內容沒有被路徑遮住 |

## 停用與回復

若插件影響正常編輯，先到「設定 → 第三方插件」停用 Bullet Zoom。停用會移除所有暫時的聚焦畫面；Markdown 原文和安裝檔都會保留。除非另外取得同意，不需要刪除插件資料夾。

## 開發

Canonical source 位於私人工作區的 `obsidian-bullet-zoom/`。公開 GitHub repo 是由這個子資料夾產生的發佈鏡像，不是另一份獨立維護的程式碼。

```bash
npm install
npm test
npm run lint
npm run build
```

正式安裝只需要建置後的 `main.js`、`manifest.json` 和 `styles.css`。建立與 `manifest.json` 同版本的 Git tag 後，GitHub Actions 會建立或更新同名 Release，並附上這三個檔案。
