# Bullet Zoom

Bullet Zoom 是一款支援 Obsidian 桌面版、手機與平板的第三方插件。它讓你把某個普通 Bullet Point 放大成目前的工作焦點，繼續編輯該節點與所有子節點，操作方式接近 Workflowy、Logseq 與 Bike。

聚焦只改變目前編輯窗格的顯示範圍，不會改寫或刪除 Markdown 原文。

## 安裝

### 使用 BRAT（建議）

1. 在 Obsidian 安裝並啟用 BRAT。
2. 開啟命令面板，執行 `BRAT: Plugins: Add a beta plugin for testing (with or without version)`。
3. 輸入 `vizance/obsidian-bullet-zoom`。
4. 選擇最新版本並完成安裝。
5. 到「設定 → 第三方插件」啟用 Bullet Zoom。

桌面版、手機與平板使用同一個 GitHub repo。日後可直接使用 BRAT 的更新命令取得新版。

### 手動安裝

從 [Latest Release](https://github.com/vizance/obsidian-bullet-zoom/releases/latest) 下載以下三個檔案：

- `main.js`
- `manifest.json`
- `styles.css`

把三個檔案放進 Vault 的 `.obsidian/plugins/bullet-zoom/`，再到「設定 → 第三方插件」啟用 Bullet Zoom。

## 開始使用

### 聚焦一個 Bullet

你可以使用以下任一方式：

- 點擊 Bullet 文字行尾的淡色 `↘`。
- 點擊普通 Bullet 的圓點。
- 把文字游標放在 Bullet 內，執行命令 `Bullet Zoom: 聚焦目前的 Bullet Point`。

聚焦後，只會顯示目前 Bullet 與它的子節點。桌面與手機都能繼續正常編輯內容。

### 返回上一層

- 點擊目前聚焦根節點行尾的 `↖`，一次返回一個父層。
- 點擊上方 Breadcrumb 中的任一祖先，直接返回該層。
- 執行命令 `Bullet Zoom: 回到上一層 Bullet`。

當你已在最外層 Bullet，再返回一次就會回到完整筆記。若想立刻離開聚焦，可執行 `Bullet Zoom: 退出 Bullet 聚焦`。

### 收合與 Zoom 的差別

Obsidian 左側的原生收合箭頭只負責收合或展開 Bullet thread，不會觸發 Zoom。

- 左側收合箭頭：收合／展開內容。
- 行尾 `↘`、Bullet 圓點或聚焦命令：進入 Zoom。

進入已收合的 Bullet 時，插件會展開覆蓋目標的必要層級，但會保留更深層原本獨立收合的內容。

## Bullet 大綱側邊欄

執行命令 `Bullet Zoom: 開啟 Bullet 大綱`，或點擊左側 Ribbon 的大綱圖示，即可在 Obsidian 原生右側欄瀏覽目前 Markdown 檔案的 Bullet 結構。

- 點擊左側 disclosure：只展開或收合大綱子節點。
- 點擊 Bullet 文字：Zoom 到該 Bullet。
- 點擊「全文」：離開 Zoom。
- 文字游標移到支援的 Bullet 時，側邊欄會同步展開路徑並標示目前節點，但不會自行 Zoom。

手機與平板沿用 Obsidian 原生右側 drawer。開啟時只自動展開目前 Bullet 所在路徑；每個節點固定維持一列，左側 disclosure、中間文字與需要時才顯示的 `…` 不會拆成額外空白行。成功 Zoom 後會自動回到原本的筆記。

過長的 Bullet 會以單行 `...` 顯示，Markdown 粗體、斜體、刪除線、inline code 與連結語法會轉成純文字：

- 桌面版：滑鼠停在文字上可查看全文。
- 手機與平板：內容確實被截斷時會顯示淡色 `…`，點擊後以 `Bullet 全文` 視窗閱讀完整文字。

## 設定

到「設定 → Bullet Zoom」可以調整：

### 永遠顯示行尾縮放箭頭

- 開啟：桌面、手機與平板都持續顯示 `↘`／`↖`。
- 關閉：桌面只在滑鼠移到該行或按鈕取得鍵盤焦點時顯示；手機與平板先點一下 Bullet 文字列，只會顯示該列的 `↘`／`↖`，再點箭頭執行 Zoom。第一次點文字列仍保留正常游標操作。

## 可用命令

Bullet Zoom 不提供預設快捷鍵，以免和 Outliner 或你的 Vault 設定衝突。你可以到「設定 → 快捷鍵」自行設定：

- `Bullet Zoom: 聚焦目前的 Bullet Point`
- `Bullet Zoom: 回到上一層 Bullet`
- `Bullet Zoom: 退出 Bullet 聚焦`
- `Bullet Zoom: 開啟 Bullet 大綱`

手機版也可以把常用命令加入 Mobile Toolbar。

## 支援範圍

目前支援 Obsidian 即時預覽模式中的普通無序清單：

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

最低支援 Obsidian 版本為 `1.11.7`。

## 手機與平板說明

插件與 BRAT 安裝包支援桌面版、手機與平板。手機大綱會依 drawer 寬度自動調整文字欄，文字固定靠左；過長內容只在尾端顯示 `...`，可點右側 `…` 查看完整純文字。插件也針對手機 Breadcrumb、editor-only 捲動、原生 drawer、單列大綱排版與 iPad 點擊事件加入自動測試。

這些自動測試只固定 DOM 與 CSS 契約，無法完整模擬 iOS 鍵盤、Dynamic Island、真實觸控排版與不同 Obsidian 主題。每個候選版本仍需在實體 iPhone 與 iPad 驗收；如果遇到畫面被遮住、點擊區域異常或捲動位置不正確，請附上裝置、OS、Obsidian 版本與截圖回報。

## 疑難排解

### 點擊左側箭頭卻沒有 Zoom

這是預期行為。左側箭頭屬於 Obsidian 原生收合功能；請點擊行尾 `↘`、Bullet 圓點，或使用聚焦命令。

### 看不到行尾箭頭

先到「設定 → Bullet Zoom」檢查「永遠顯示行尾縮放箭頭」。如果保持關閉，桌面版需要把滑鼠移到該 Bullet 行；手機與平板需要先點一下 Bullet 文字列，再點出現的行尾箭頭。

### 命令沒有作用

確認目前使用即時預覽模式，而且文字游標位於普通無序 Bullet 內。Task List、編號清單、Source Mode 與 Reading View 目前不支援。

### 側邊欄沒有內容

先開啟一份即時預覽模式的 Markdown 筆記，再重新執行 `Bullet Zoom: 開啟 Bullet 大綱`。

## 版本紀錄與回報

- [最新版本與 Release Notes](https://github.com/vizance/obsidian-bullet-zoom/releases/latest)
- [所有歷史版本](https://github.com/vizance/obsidian-bullet-zoom/releases)
- [問題回報](https://github.com/vizance/obsidian-bullet-zoom/issues)

README 只保留目前版本的安裝與使用方式。每個版本的功能變更、修正與驗證狀態會記錄在對應的 GitHub Release Notes。

## 開發

原始碼與測試保留在公開 repository，方便檢查、維護與避免功能回歸；它們不會被 BRAT 安裝到 Vault。建置、測試與發布檔案邊界請參考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
