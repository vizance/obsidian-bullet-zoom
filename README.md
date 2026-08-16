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

- 桌面版、手機與平板：點擊普通 Bullet 的圓點。
- 把文字游標放在 Bullet 內，執行命令 `Bullet Zoom: 聚焦目前的 Bullet Point`。

聚焦後，上方 Breadcrumb 會以 Home icon 代表完整筆記，並顯示目前所在路徑。編輯區會把目前 Bullet 的原始可編輯文字直接呈現成頁面標題，不會在下方重複顯示同一個 Bullet；標題下面會直接接續它的子節點。

聚焦內容最下方的淡色 `＋` 可以新增一個空白子 Bullet。新節點會接在既有子節點與其後代之後，並依目前 Obsidian／Outliner 的空白或 Tab 縮排設定，建立成目前節點的下一層直接子節點。新增後可直接輸入，一次 Undo 就能撤銷新增動作。

### 返回上一層

- 點擊上方 Breadcrumb 中的任一祖先，直接返回該層。
- 點擊 Breadcrumb 最左側的 Home icon，直接回到完整筆記。
- 執行命令 `Bullet Zoom: 回到上一層 Bullet`。

當你已在最外層 Bullet，再返回一次就會回到完整筆記。若想立刻離開聚焦，可執行 `Bullet Zoom: 退出 Bullet 聚焦`。

### 收合與 Zoom 的差別

Obsidian 左側的原生收合箭頭只負責收合或展開 Bullet thread，不會觸發 Zoom。

- Obsidian 原生收合箭頭：收合／展開內容。
- Bullet 圓點或聚焦命令：進入 Zoom。

進入已收合的 Bullet 時，插件會展開覆蓋目標的必要層級，但會保留更深層原本獨立收合的內容。

## Bullet 大綱側邊欄

執行命令 `Bullet Zoom: 開啟 Bullet 大綱`，或點擊左側 Ribbon 的大綱圖示，即可在 Obsidian 原生右側欄瀏覽目前 Markdown 檔案的 Bullet 結構。

- 點擊左側 disclosure：直接展開或收合大綱子節點；即使該節點位於目前 Bullet 的祖先路徑，也不需要先回到編輯器選取它。
- 點擊 Bullet 文字：單擊一次就會 Zoom 到該 Bullet。
- 點擊最上方的 Home icon：離開 Zoom，回到完整筆記。
- 文字游標移到支援的 Bullet 時，側邊欄會同步展開路徑並標示目前節點，但不會自行 Zoom。
- 每個同層節點前會顯示 `1.`、`2.`、`3.` 的順序編號；子層會從 `1.` 重新開始，編號只顯示在大綱中，不會改寫 Markdown。
- 收合／展開按鈕使用固定尺寸的置中圖示，桌面版、手機與平板都保留原本的獨立操作與點擊範圍。

手機與平板沿用 Obsidian 原生右側 drawer。開啟時只自動展開目前 Bullet 所在路徑；每個節點固定維持一列，左側 disclosure、中間文字與需要時才顯示的 `…` 不會拆成額外空白行。成功 Zoom 後會自動回到原本的筆記。

Breadcrumb 與大綱標籤只顯示語意純文字，不會顯示 `**`、`~~`、反引號或連結網址等 Markdown 語法。過長的 Bullet 會以單行 `...` 顯示：

- 桌面版：滑鼠停在文字上可查看全文。
- 手機與平板：內容確實被截斷時會顯示淡色 `…`，點擊後以 `Bullet 全文` 視窗閱讀完整文字。

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

### 點擊 Obsidian 收合箭頭卻沒有 Zoom

這是預期行為。Obsidian 的獨立收合箭頭只負責 fold／unfold；即使 Bullet 本身可以收合，點擊 Bullet 圓點仍會直接 Zoom。也可以使用聚焦命令進入 Zoom。

### 命令沒有作用

確認目前使用即時預覽模式，而且文字游標位於普通無序 Bullet 內。Task List、編號清單、Source Mode 與 Reading View 目前不支援。

### 側邊欄沒有內容

先開啟一份即時預覽模式的 Markdown 筆記，再重新執行 `Bullet Zoom: 開啟 Bullet 大綱`。

## 版本紀錄與回報

### `0.1.47`

- 新增設定「拆分筆記模板」：選一份 `.md` 當骨架（欄位有自動完成），拆分時套用。
- 支援佔位符 `{{content}}`（拆分內容）、`{{title}}`（新筆記名）、`{{date}}`、`{{time}}`、`{{source}}`（來源筆記連結）；大小寫與內部空白皆可，模板沒有 `{{content}}` 時內容自動接在後面，留空則維持原本行為。

### `0.1.46`

- 「拆分後的新筆記位置」改為自動完成：輸入時即時列出 vault 既有資料夾，可點選或用上下鍵＋Enter 選取，Escape 關閉；仍可自行輸入不存在的資料夾。

### `0.1.45`

- 拖移大綱項目時鎖定面板捲動，手機上畫面不再跟著手指滑動，放開後回到原捲動位置。
- 新增設定「拆分後的新筆記位置」：填資料夾路徑即固定建立在該處（自動建立不存在的資料夾），留空維持與目前筆記同資料夾。
- 拆分視窗的名稱欄預設帶入該 Bullet 的文字並全選，連結語法與不合法字元會自動清掉。

### `0.1.44`

- 新增指令「拆分 Bullet 成新筆記」：游標停在 Bullet 上執行，輸入名稱後在同資料夾建立新筆記，內容搬過去，原位置留下 `- [[新筆記]]` 連結，清單結構與大綱維持完整。
- 新增設定「拆分時移除最上層 Bullet」（預設開啟）：開啟時新筆記只保留子項目並自動歸零縮排，關閉時整段連最上層一起搬。

### `0.1.43`

- Bullet 大綱支援拖移：滑鼠拖動（位移 8px 啟動）或手指長按（約 0.35 秒）後拖動大綱項目，放到目標列上緣為前一個兄弟、下緣為後一個兄弟；Markdown 中對應 Bullet 連同整個縮排子樹一起搬移並自動換算縮排。
- 不允許拖進自己的子孫底下；拖移後不會誤觸 Zoom。

### `0.1.42`

- 編號清單項目（`1.`、`2)`）也能 Zoom、進大綱與麵包屑（預設開啟）。
- 設定頁新增兩個開關：「Zoom 一般 Bullet」與「Zoom 編號清單」，可分別開關偵測、即時生效；關閉編號偵測即回到過去的排除行為。

### `0.1.41`

- Bullet 大綱依筆記標題（H1–H6）分區顯示：標題為純視覺標頭（不可點擊），各區頂層編號從 1 重新起算。
- Frontmatter 與程式碼區塊內的 `#` 不會誤判為標題；沒有標題的筆記行為不變。

### `0.1.40`

- 修正 0.1.39 大綱列排版錯亂：編號樣式回復原設計（同一行對齊），移除葉節點小圓點。
- 手機麵包屑改為完整顯示每層文字（不逐層截斷），過長靠水平捲動。
- 「查看全文」按鈕從「…」改為放大鏡圖示，不再與省略號混淆。

### `0.1.39`

- Bullet 大綱參考 Workflowy 緊湊化：階層編號縮小淡化並貼齊三角形、葉節點顯示小圓點、手機縮排每層加深到 12px，層級一眼可辨。
- 手機麵包屑完整顯示每一層路徑（含分隔符號），過長可水平捲動，各層超寬以省略號截斷。

### `0.1.38`

- 設定頁兩條字級滑桿各加一顆重設按鈕，點一下回到預設 100%。
- 修正「Bullet 全文」視窗實機關閉仍會往下滑的問題：改用行內 important 樣式強制隱藏，關閉即瞬間消失。

### `0.1.37`

- 新增設定頁，兩條滑桿（60%–160%，間距 5%）分別調整「聚焦頁標題大小」與「Bullet 大綱文字大小」，拖動即時生效並自動記憶。

### `0.1.36`

- Zoom 進深層 Bullet 後，聚焦頁改以該節點為基準重新排版：標題滿版顯示、不再被原始縮排推到右半邊。
- 分支內的子項目以相對深度縮排（直接子項為第一層），窄畫面也能在一個畫面閱讀；手機標題字級自適應縮放。

### `0.1.35`

- 「Bullet 全文」視窗關閉時整個視窗與遮罩立即消失，不再播放往下滑出的動畫。

### `0.1.34`

- 修正手機版 Bullet 大綱點「…」關閉全文視窗後，清單延遲往下捲動的問題。
- 關閉視窗後不再把焦點還給「…」按鈕（iOS 會因此偷捲畫面），大綱捲動位置原位保留；只有真正切換筆記或 Zoom 節點時才自動定位。

### `0.1.33`

- 手機版限縮清單摺疊箭頭（collapse indicator）的觸控範圍到圖示本身，點 Bullet 圓點確實進入 Zoom、點文字正常編輯，不再誤觸原生 Fold/Unfold。
- 僅在手機模式掛上 `bullet-zoom-phone-pane` 樣式範圍；桌面版與標題摺疊行為完全不變，停用外掛即還原。

### `0.1.32`

- 排除位於有序清單 `1.`、`2.` 之下的 `-` 子項目，避免它們混入 Bullet 大綱。
- Bullet 大綱只保留真正屬於無序 `-` 清單樹的項目。

### `0.1.31`

- Bullet 大綱改用完整階層編號，子層依序顯示 `1.1`、`1.1.1`。
- 手機版 Bullet 大綱改用較小的 UI 字級，保留 `44px` 觸控高度以容納更多文字。

### `0.1.30`

- 修正手機版原生 drawer 開啟時 Bullet 大綱內容空白的問題。
- 手機版即使右側 split 在 Obsidian 內部標記為 collapsed，仍會建立並顯示大綱項目。

### `0.1.29`

- Bullet 大綱顯示每個同層節點的 `1.`、`2.`、`3.` 順序編號，巢狀層級各自從 `1.` 開始。
- 收合／展開圖示改用固定 `16 × 16` 幾何，降低手機版 fold／unfold 切換時的視覺位移。

- [最新版本與 Release Notes](https://github.com/vizance/obsidian-bullet-zoom/releases/latest)
- [所有歷史版本](https://github.com/vizance/obsidian-bullet-zoom/releases)
- [問題回報](https://github.com/vizance/obsidian-bullet-zoom/issues)

README 只保留目前版本的安裝與使用方式。每個版本的功能變更、修正與驗證狀態會記錄在對應的 GitHub Release Notes。

## 開發

原始碼與測試保留在公開 repository，方便檢查、維護與避免功能回歸；它們不會被 BRAT 安裝到 Vault。建置、測試與發布檔案邊界請參考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
