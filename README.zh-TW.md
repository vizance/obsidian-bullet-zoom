# Bullet Zoom

在 Obsidian 裡把任何一個 Bullet 放大成獨立頁面來工作，桌面版、手機與平板都支援。

Bullet Zoom 把 Workflowy、Logseq 與 Bike 的大綱工作流帶進 Obsidian：聚焦一段分支、用 Bullet 大綱瀏覽整份筆記、拖移排序，還能把一段分支拆成獨立筆記。

聚焦只改變目前編輯窗格的顯示範圍，不會改寫你的 Markdown。

[English README](README.md)

## 安裝

### 使用 BRAT（建議）

1. 在 Obsidian 安裝並啟用 BRAT。
2. 執行 `BRAT: Plugins: Add a beta plugin for testing (with or without version)`。
3. 輸入 `vizance/obsidian-bullet-zoom`。
4. 選擇最新版本。
5. 到「設定 → 第三方外掛」啟用 Bullet Zoom。

桌面版、手機與平板使用同一個 repository，之後用 BRAT 的更新指令取得新版。

### 手動安裝

從 [最新 Release](https://github.com/vizance/obsidian-bullet-zoom/releases/latest) 下載 `main.js`、`manifest.json`、`styles.css`，放進 Vault 的 `.obsidian/plugins/bullet-zoom/`，再啟用外掛。

需要 Obsidian `1.11.7` 以上版本。

## 聚焦一個 Bullet

兩種方式：

- 點擊 Bullet 的圓點（編號清單則點數字）。
- 把游標放進 Bullet 內，執行 **Zoom into current bullet**。

聚焦後，該 Bullet 的文字會成為頁面標題，子節點接在下面。上方麵包屑顯示完整路徑，最左邊的房子圖示代表整份筆記。版面會以聚焦的 Bullet 為基準重排，所以再深的分支也能用滿整個畫面寬度。

內容最下方的淡色 `+` 可以新增空白子 Bullet，縮排依你目前的 Obsidian 或 Outliner 設定，一次 Undo 就能撤銷。

### 返回上一層

- 點麵包屑上的任一祖先，直接跳到該層。
- 點房子圖示回到完整筆記。
- 執行 **Go to parent bullet**，或用 **Exit bullet focus** 直接離開聚焦。

### 語音轉文字與 AI 工具照樣能用

語音轉文字或 AI 寫作工具常會插入破壞清單格式的段落。Bullet Zoom 會讓這些內容照常顯示，並在你停止輸入約半秒後整理聚焦區域：每一行都變成 Bullet，縮排到它前面那個 Bullet 的下一層，同一批的行彼此平輩，空行直接移除，文字一個字都不會被改寫。原本就巢狀在更深層的 Bullet 維持不變，程式碼區塊不動。按一次 Undo 只還原這個修復。整理只在 Zoom 狀態下運作，沒有聚焦時的一般編輯完全不受影響。可在 **Focus page** 區塊的 **Fix broken bullets** 關閉。

### 徑向選單

在手機上長按 Bullet 圓點，指令會像扇子一樣在拇指旁邊展開。手指不放直接滑到某一格再放開就執行；也可以放開後再點某一格。點中央按鈕、點選單外或按 Escape 則關閉選單、不執行任何動作。

扇形會朝畫面空間較大的一側展開——靠近左緣的 Bullet 就往右展開——靠近上下邊緣時弧度也會收窄，所以不會有格子跑到畫面外。每一格顯示圖示而不是文字，拇指停在哪一格，該格的指令名稱就顯示在中央下方。

八個插槽各綁一個 Obsidian 指令 ID 並附一個開關，所以選單可以放外掛自己的 Bullet 指令，也可以放其他外掛的任何指令；關掉某一格時會保留已選的指令，隨時可以再打開。預設前五格是複製、刪除、加前綴、Zoom、拆分成新筆記。

外掛附帶三個 Bullet 指令，在指令面板也能用：

- **Copy bullet**：複製該 Bullet 的文字，或依複製範圍設定連子項目一起複製。
- **Delete bullet**：刪除該 Bullet 與其下所有巢狀內容，含換行。
- **Insert prefix text**：在標記後插入設定的前綴，已存在時則移除。

設定在 **Radial menu** 區塊：啟用開關、長按時間，以及每一格的指令選擇。短按仍然是 Zoom，手指移動則取消手勢，捲動不受影響。

### 摺疊與 Zoom 是兩件事

Obsidian 原生的摺疊箭頭只負責收合與展開，不會觸發 Zoom；Bullet 圓點才是 Zoom。每一行清單會依實際量測的座標切成三區：圓點左邊的摺疊箭頭、圓點本身，以及後面的文字。因為分區來自量測而不是即時預覽怎麼渲染那一行，所以不論編輯器有沒有焦點，點圓點都會 Zoom。摺疊區涵蓋圓點左邊的整片空間（含縮排），可摺疊的行在這片區域內任何位置點擊都能收合；沒有東西可摺疊的行完全不會被攔截，摺疊箭頭也維持 Obsidian 原本的大小與對齊。

Zoom 進已收合的 Bullet 時，只會展開必要的層級，更深層原本收合的內容維持原狀。

## Bullet 大綱

執行 **Open bullet outline** 或點左側 Ribbon 圖示，在右側欄瀏覽目前筆記的 Bullet 結構。

- 點文字 Zoom 進去，點三角形展開或收合。
- 筆記中的標題（`#` 到 `######`）會顯示成不可點擊的分區標頭，每個分區的頂層編號從 `1.` 重新起算。
- 每列顯示階層編號（`1.`、`1.1`、`1.1.1`），編號只用於顯示，不會寫進 Markdown。
- 最上方的房子圖示可離開 Zoom、回到完整筆記。
- 游標移到某個 Bullet 時，大綱會展開對應路徑並標示位置，但不會自行 Zoom。
- 標籤只顯示純文字，不會出現 `**`、反引號或連結網址。被截斷的列會顯示放大鏡按鈕，點開可讀全文。

手機與平板沿用 Obsidian 原生右側 drawer，開啟時只展開目前路徑，成功 Zoom 後自動收起。

### 拖移排序

用滑鼠拖動某一列，或在觸控裝置長按約 0.35 秒後拖動，放在目標列的上半＝排到它前面，下半＝排到它後面。

Bullet 會連同整個縮排子樹一起搬，縮排自動換算成目標位置的層級。不允許把分支拖進自己的子孫底下。拖移期間大綱不會捲動，畫面不會跟著手指滑走。

## 把 Bullet 拆成新筆記

游標停在 Bullet 上，執行 **Extract bullet to new note**，輸入名稱（會預先帶入該 Bullet 的文字並全選）後確認。

內容會搬到新筆記，原位置依你的設定更新，清單結構與大綱維持完整。

**Extract to new note** 區塊的設定：

| 設定 | 作用 |
| --- | --- |
| Destination folder | 新筆記建立的位置，輸入時會自動完成既有資料夾。留空表示與目前筆記同資料夾，資料夾不存在會自動建立。 |
| Template file | 當作骨架的 Markdown 檔，留空表示不套模板。 |
| Replacement text | 原位置留下什麼：連結（預設）、嵌入，或什麼都不留。 |
| After extracting | 留在原筆記（預設），或以目前分頁、新分頁、分割視窗開啟新筆記。 |
| Remove the top bullet | 預設開啟：新筆記只保留子項目，並自動歸零縮排。 |

### 模板佔位符

| 佔位符 | 內容 |
| --- | --- |
| `{{content}}` | 拆分出來的 Bullet 內容 |
| `{{title}}` | 你輸入的筆記名稱 |
| `{{date}}` | 本地日期，`YYYY-MM-DD` |
| `{{time}}` | 本地時間，`HH:mm` |
| `{{source}}` | 指回來源筆記的 wiki 連結 |

佔位符不分大小寫，也允許內部空白。模板中沒有 `{{content}}` 時，內容會接在模板後面。

## 設定

設定分成五區：

- **Zoom**：一般 Bullet 與編號清單可各自開關偵測。
- **Outline**：調整大綱文字大小，調小可一次看到更多行。
- **Focus page**：調整 Zoom 後的標題大小，可開關縮排引導線與自動修復破損的 Bullet。
- **Radial menu**：長按選單的開關、長按時間，以及每一格的指令與啟用開關。
- **Extract to new note**：上面列出的拆分選項。

兩個大小滑桿範圍都是 60% 到 160%，各有一顆重設按鈕。縮排引導線會在聚焦頁畫出連接巢狀 Bullet 的垂直線，預設開啟。

## 指令

Bullet Zoom 不預設快捷鍵，避免和 Outliner 或你自己的設定衝突。可在「設定 → 快捷鍵」自行指定：

- `Bullet Zoom: Zoom into current bullet`
- `Bullet Zoom: Go to parent bullet`
- `Bullet Zoom: Exit bullet focus`
- `Bullet Zoom: Open bullet outline`
- `Bullet Zoom: Extract bullet to new note`
- `Bullet Zoom: Copy bullet`
- `Bullet Zoom: Delete bullet`
- `Bullet Zoom: Insert prefix text`

手機上可以把常用指令加進工具列。

## 支援的語法

在即時預覽模式下支援無序清單，以及（開啟設定後）編號清單：

```markdown
- 減號 Bullet
* 星號 Bullet
+ 加號 Bullet
1. 編號項目
2) 編號項目
```

目前不支援：Task List、Source Mode、Reading View、標題聚焦，以及跨重啟保留聚焦狀態。

## 手機與平板

外掛與 BRAT 安裝包支援桌面版、手機與平板。自動測試固定了麵包屑、editor-only 捲動、原生 drawer、單列大綱排版與觸控區域的 DOM 與 CSS 契約。

這些測試無法模擬 iOS 鍵盤、Dynamic Island、真實觸控排版與第三方佈景，因此每個候選版本仍會在實體 iPhone 與 iPad 驗收。若遇到畫面被遮住、點擊區域異常或捲動位置不正確，請附上裝置、OS、Obsidian 版本與截圖回報。

## 疑難排解

**點摺疊箭頭沒有 Zoom。** 這是預期行為，摺疊箭頭只負責摺疊。請點 Bullet 圓點或使用 Zoom 指令。

**指令沒有作用。** 確認在即時預覽模式，且游標位於支援的 Bullet 內。若是編號項目，請到設定開啟 **Zoom numbered items**。

**大綱是空的。** 先開啟一份即時預覽模式的 Markdown 筆記，再執行一次 **Open bullet outline**。

**拆分時說找不到模板。** 檢查 **Extract to new note** 區塊裡的模板路徑。

## 版本紀錄

每個版本的說明（英文與繁體中文）請見 [Releases 頁面](https://github.com/vizance/obsidian-bullet-zoom/releases)。

## 開發

原始碼與測試保留在公開 repository，方便檢查、維護與避免功能回歸；BRAT 不會把它們安裝進 Vault。建置、測試與發布檔案邊界請參考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
