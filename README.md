# Bullet Zoom

Bullet Zoom 是一款 Obsidian 插件，讓你在即時預覽模式裡聚焦某一個普通 Bullet Point，繼續編輯該節點與它的所有子節點。聚焦只改變目前編輯窗格的顯示範圍，不會改寫或刪除 Markdown 原文。

## 目前狀態

- 版本：`0.1.1`
- 最低 Obsidian 版本：`1.11.7`
- 桌面版人工驗收：已通過 Obsidian `1.13.5`
- 手機版模擬驗收：已通過 Obsidian `1.13.5` 的 322 × 704 px 窄螢幕模擬
- 實體手機驗收：尚未進行，不宣稱已實機驗證
- 正式 Vault：尚未安裝

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

聚焦後，上方路徑會顯示筆記名稱、所有父節點和目前節點。點擊父節點可回到較上層的分支；點擊筆記名稱，或執行 `Bullet Zoom: 退出 Bullet 聚焦`，可回到完整筆記。

路徑最右側是目前所在層級。`0.1.1` 起會使用目前 Obsidian 主題的強調色標示，其他父層維持中性色；這個狀態也會透過 `aria-current="location"` 提供給輔助科技。

插件不會預設占用快捷鍵。桌面版可自行替命令指定快捷鍵；手機版可把命令加入 Mobile Toolbar。

## 安裝

建置完成後，把下列三個檔案放進 Vault 的 `.obsidian/plugins/bullet-zoom/`：

- `main.js`
- `manifest.json`
- `styles.css`

接著在 Obsidian 的「設定 → 第三方插件」啟用 Bullet Zoom。

目前只安裝在專用測試 Vault。正式 Vault 必須等使用者明確同意後才會安裝。

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

- 窄螢幕模擬：已通過
- 實體手機：待使用者同意正式安裝後，由使用者確認輕觸、命令、輸入、路徑與退出五項流程

#### 窄螢幕模擬紀錄

環境：macOS、Obsidian `1.13.5`、Developer Tools Responsive Mode、322 × 704 CSS px、專用 `.test-vault`。

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

```bash
npm install
npm test
npm run lint
npm run build
```

正式安裝只需要建置後的 `main.js`、`manifest.json` 和 `styles.css`。
