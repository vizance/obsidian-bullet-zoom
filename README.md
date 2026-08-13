# Bullet Zoom

Bullet Zoom 是一款 Obsidian 插件，讓你在即時預覽模式裡聚焦某一個普通 Bullet Point，繼續編輯該節點與它的所有子節點。聚焦只改變目前編輯窗格的顯示範圍，不會改寫或刪除 Markdown 原文。

## 目前狀態

- 目前開發版本：`0.1.16`
- 目前公開 BRAT 版本：`0.1.15`
- 最低 Obsidian 版本：`1.11.7`
- 桌面版人工驗收：macOS Obsidian `1.13.7` 專用 `.test-vault` 已實際通過原生右側欄、五層垂直展開、disclosure／Zoom 分工、folded target、側欄持續顯示、分割窗格來源跟隨與 Light／Dark；自動化控制無法可靠拖曳原生 sidebar divider，所以可調寬度仍保留為單一待驗 gate。`0.1.15` 的桌面級聯選單曾通過較淺層測試，但真實深層筆記試用失敗
- 手機版自動驗收：`0.1.16` 已加入原生 sidebar ItemView、單欄 disclosure tree、同檔案來源同步、手機／平板選取後返回來源 editor，以及不依賴 editor click bubbling 的 iPad 行尾按鈕回歸；jsdom 不具真實 Obsidian mobile drawer、iOS 排版、觸控合成與鍵盤動畫，這不代表實體 iPhone 或 iPad 已通過
- 實體行動裝置驗收：`0.1.6` 未通過；聚焦三層 Bullet 時會把外層編輯畫面推到狀態列與 view header 下方。`0.1.16` 的原生側邊欄／drawer、folded-target Zoom、editor-only 捲動、常駐箭頭、點擊後行高與 iPad 單次 tap 仍待實體 iPhone／iPad 複驗
- 正式 Second Brain Vault：已於 2026-08-11 透過 BRAT 更新到 `0.1.8`，桌面實際操作通過；實體 iPhone 待複驗

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

`0.1.8` 起，Obsidian 的收合箭頭只負責收合或展開該 Bullet thread，Bullet Zoom 不會再攔截這個操作。Bullet 圓點仍負責 Zoom。若目前主題用收合箭頭覆蓋父 Bullet 的圓點，可先把游標放在該行，再從命令面板、快捷鍵或 Mobile Toolbar 執行 `Bullet Zoom: 聚焦目前的 Bullet Point`。

`0.1.9` 起，聚焦路徑改成接近 Bike 的輕量文字導覽。最左側的 `‹` 一次回到上一層；筆記名稱與父節點仍可直接跳回；最右側目前層級是不可點擊的文字，使用 Obsidian 主題強調色底線標示。桌面版顯示完整路徑，手機版維持單列，只顯示 `‹`、「全文」、最近一層父節點與目前節點。

`0.1.10` 起，每個可聚焦的普通 Bullet 會在第一行文字尾端提供獨立的 `↳` Zoom 控制。收合箭頭仍只負責收合／展開 thread；行尾控制、Bullet 圓點與命令才會進入 Zoom。桌面版只有滑鼠移到該行，或按鈕本身取得鍵盤焦點時才顯示控制；單純把文字游標停在該行不會顯示。手機版沒有 hover，因此只在目前編輯行顯示至少 44 × 44 CSS px 的觸控區。

`0.1.11` 曾建立 breadcrumb 下層選單候選版，但沒有發佈。實際試用後確認這會把「回到祖先」與「往下鑽入」兩種操作混在同一條路徑，因此由 `0.1.12` 取代。

`0.1.12` 起，breadcrumb 只保留筆記、祖先與目前節點；點擊可直接回到指定祖先，不再有 hover 選單或下層內容。每個可聚焦 Bullet 的第一行文字尾端改用淡色 `↘`，目前聚焦根節點則用 `↖` 回到全文。箭頭沿用正文的字級與行高，沒有圓形底色、額外 padding、固定按鈕尺寸或上下 margin；桌面版只在滑鼠 hover 該行或鍵盤聚焦按鈕時顯示，手機與平板只在目前編輯行顯示。`Bullet Zoom: 回到上一層 Bullet` 命令不受影響，仍可綁定快捷鍵或 Mobile Toolbar。

`0.1.13` 起，所有支援 Bullet 的 `↘` 與目前聚焦根節點的 `↖` 會在桌面、手機和平板常駐，不需要 hover、文字游標或 active line 才出現。箭頭使用 Obsidian 的 `--text-faint`，會隨淺色／深色主題切換灰度；normal、hover、focus 與 active 都維持透明背景、無陰影、繼承正文 font size，並把 glyph box 限制在 `1em`，避免手機點擊後出現拉高該行的灰色按鈕區塊。鍵盤操作時只加上 `--text-muted` 外框，且不改變版面幾何。

`0.1.14` 起，已收合的 Bullet thread 只保留父節點自己的 `↘`，被 fold 蓋住的子節點不再把額外箭頭投影到 `…` 旁邊。從行尾箭頭、Bullet 圓點、命令或 breadcrumb 進入已收合節點時，插件會在同一筆 editor transition 先展開該節點自己的 fold；若游標目標原本被祖先 fold 蓋住，也會一併解除覆蓋目標的 fold 再 Zoom。進入後只顯示根節點的 `↖`，可見子節點向下正常排列。更深層原本獨立收合的 thread 仍保持收合，Markdown 原文不會改變；退出 Zoom 後，剛才的目標節點維持展開。

`0.1.15` 曾在聚焦路徑最右側加入獨立的「切換 Bullet」按鈕，桌面使用 Bike 風格級聯欄位、手機與平板使用 bottom sheet。實際深層筆記試用確認：級聯欄位會不斷往右增加，最深節點超出 viewport 後無法可靠選取，因此這套浮動選單已在 `0.1.16` 移除。

`0.1.16` 改用 Obsidian 原生右側欄顯示目前 Markdown 檔案的 Bullet 大綱。整棵大綱只使用一個可垂直捲動的 disclosure tree，不會隨深度增加水平欄位；左側 disclosure 只展開或收合子節點，文字按鈕才會 Zoom，`全文` 會離開 Zoom。游標移到支援的 Bullet 時，右側欄會自動展開父層、標示並捲到該節點，但不會因此 Zoom；游標不在支援 Bullet 上時，才回退顯示目前 Zoom 節點。Breadcrumb 最右側原本的選單按鈕已移除，命令 `Bullet Zoom: 開啟 Bullet 大綱`、Ribbon 圖示與 Obsidian 原生右側欄入口仍可開啟同一個側邊欄。桌面選取後側邊欄保持開啟；手機與平板選取後交回來源 editor，讓 Obsidian 自己處理 drawer 收合。大綱只讀取目前 Markdown 檔案中的普通無序 Bullet，不包含其他檔案、Heading、Task List 或編號清單；若整份語法樹尚未完成，只顯示可重試的解析狀態，不會把局部結果當成完整筆記。一般輸入後會保留側欄捲動位置，明確重新開啟或游標切換 Bullet 時才把目前節點捲回畫面；原生側欄或手機 drawer 隱藏時不會在背景重建 DOM。大綱最多處理 1,000 個結構節點與 128 層巢狀深度，超出時顯示非互動式限制訊息，避免阻塞編輯器。

同一版也修正行尾控制：聚焦根節點的 `↖` 每次只回到直接父 Bullet，只有最外層 Bullet 再按一次才會回到全文。行尾原生按鈕改由自己的 CodeMirror Widget 處理 activation，不依賴 click 先冒泡到 editor，因此 iPad 不應再發生第一下只啟用編輯列、必須再點左側 Bullet marker 的情況。這項互動已由非冒泡事件測試與 macOS Obsidian 實測固定，實體 iPhone／iPad 仍須在正式發布前完成驗收。

`0.1.3` 起可執行 `Bullet Zoom: 回到上一層 Bullet`，一次只回到目前節點的直屬父 Bullet。請到「設定 → 快捷鍵」搜尋 `回到上一層 Bullet`，再依目前 Vault 的快捷鍵配置指定按法。連續執行會逐層返回；目前已在最外層 Bullet 時，再執行一次會回到完整筆記。若要不經過父層、直接回到完整筆記，仍可執行 `Bullet Zoom: 退出 Bullet 聚焦`。

桌面與手機聚焦時都會暫時隱藏目前窗格的 inline title 與 Properties，讓目標 Bullet 緊接在路徑下方。其他分割窗格不受影響；退出聚焦後，標題與 Properties 會立即恢復。

`0.1.4` 曾把手機路徑移到 `EditorView.scrollDOM` 前方，但實機證明這仍然位於 Obsidian 手機的安全正文區之外。`0.1.5` 改成由 CodeMirror 把路徑建立在 focused Bullet 前方的正文 block；路徑和 Bullet 會共用 `.cm-scroller` 的 padding、捲動與 safe-area 座標系。桌面版維持原本的 sticky top panel，其他插件的 top panel 也不受影響。

`0.1.5` 實機確認 Breadcrumb 已回到正確位置，但進入深層 Bullet 時不會自動把它帶進目前可視區。`0.1.6` 會在手機每次成功聚焦或返回父層時，由 CodeMirror 在 Breadcrumb block 建立後把新聚焦 Bullet 定位到可視區上方，並預留 52 CSS px 容納導覽列，讓路徑與目標 Bullet 一起出現在鍵盤上方；桌面版不增加這個自動捲動。

`0.1.6` 實機顯示 CodeMirror 的預設定位會連外層 Obsidian 容器一起捲動，把游標和目標 Bullet 推到狀態列、Dynamic Island 與 view header 下方。`0.1.7` 保留同樣的 52 CSS px Breadcrumb 預留，但只改變目前 editor 的 `.cm-scroller.scrollTop`，並阻止預設流程再推動外層畫面。

路徑最右側是目前所在層級。`0.1.9` 改用細底線取代整顆強調色按鈕，並保留 `aria-current="location"` 給輔助科技；因為它只用來表示位置，所以不再接受點擊。

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

桌面版和手機版都使用同一個 repo。若手機的 Second Brain 已透過 Obsidian Sync 同步設定，也可以直接在手機的 BRAT 加入同一個路徑。目前最新公開 GitHub Release 是 `0.1.16`，可直接透過 BRAT 更新。實體手機更新與複驗完成前，不宣稱手機 UX 已正式通過。

### 手動安裝（備用）

從最新的 GitHub Release 下載 `main.js`、`manifest.json`、`styles.css`，放進 Vault 的 `.obsidian/plugins/bullet-zoom/`，再到「設定 → 第三方插件」啟用 Bullet Zoom。

正式 Second Brain Vault 已在 2026-08-10 以三檔安裝包完成初次安裝與桌面啟用；後續版本改由 BRAT 管理即可。

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
- 後續實體 iPhone 截圖確認 `0.1.4` 複驗未通過：鍵盤關閉時 compact Breadcrumb 仍位於 Dynamic Island 與 Obsidian view header 上方

2026-08-10 完成 `0.1.5` 驗證與發佈：

- 失敗回歸測試先固定 `0.1.4` 的錯誤：`scrollDOM.before(...)` 產生的路徑不在 `.cm-scroller` 內，無法共用 Obsidian 加在正文捲動區的安全位置補償
- 手機 compact Breadcrumb 改為 focused branch 第一行前的 CodeMirror block widget；不建立 Bullet Zoom top panel，也不再使用 `MutationObserver` 搬移 DOM
- 手機／桌面分流改用 Obsidian 公開的 `Platform.isPhone` 與必填的 `{ isPhone }` 參數，測試直接注入手機或桌面模式，不依賴 `body.is-phone` class 的載入時序，也不會因漏傳參數靜默走回 desktop panel
- 手機路徑的 `全文`／父層操作、聚焦失效與 view destroy 清理、其他 top panel 共存，以及桌面 sticky top panel baseline 均有回歸測試
- `npm test`：70 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.5`
- 專用 `.test-vault` 已重新載入 `0.1.5` 三檔 bundle；在 Obsidian `1.13.5` 實際執行命令聚焦深層 Bullet、點擊父層、再點擊筆記回到全文，桌面完整 sticky Breadcrumb 正常，Obsidian 狀態列回到全文後仍顯示 213 characters
- `.test-vault` 的 `main.js`、`manifest.json`、`styles.css` SHA-256 與 canonical build 逐檔一致
- standalone commit `68b8165` 已建立 GitHub Release `0.1.5`；Actions run `31369619110` 通過。下載回讀的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `1fe5ef40c05edb1c19cf1e0c013980e7e0d330fdcacdeaa531ad7a8745ec0bb2`、`7f0ec6fb81223c9819280f6c184d6cbe2e0155e84f6a9c593059d265fe2ef8d7`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- 這些自動測試只驗證 DOM 所屬座標系與操作生命週期，沒有模擬實體 iOS 幾何；`0.1.5` 已發佈，仍待實體 iPhone 複驗

2026-08-10 完成 `0.1.6` 驗證與發佈：

- 實體 iPhone 回報確認 `0.1.5` 的 Breadcrumb 位置已正常，但聚焦三層最內節點後，必須先收起鍵盤再手動往上捲動才能看到 Breadcrumb
- 根因是 `enterFocusAt()` 只更新 selection 與 focus effect，沒有建立 CodeMirror scroll target；鍵盤縮短 viewport 時，新插入在目標 Bullet 上方的 Breadcrumb block 容易落在可視區之外
- 手機成功進入深層節點與透過 Breadcrumb 返回父層時，focus transaction 現在會把新聚焦 Bullet 定位到可視區上方，並預留 52 CSS px 給至少 44 CSS px 高的 compact Breadcrumb；桌面相同流程不產生插件自有的自動定位 request
- `npm test`：71 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.6`
- 專用 `.test-vault` 已重新載入 `0.1.6` 三檔 bundle；在 Obsidian `1.13.5` 執行深層 Bullet 聚焦、點擊父層、再點擊筆記回到全文，桌面完整 sticky Breadcrumb、inline title 與 Properties 維持原本行為，全文恢復後仍為 213 characters
- `.test-vault` 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `623a109c6619d04493b9158fad8d26b69f7351b0f5779c396e7ab411839fd8db`、`d61b2602f732e1045d32269f4847c3d5230533d8a930b8bbe501d493da35a60c`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- standalone commit `5529f4f` 已建立 GitHub Release `0.1.6`；Actions run `31372187516` 通過。下載回讀的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `623a109c6619d04493b9158fad8d26b69f7351b0f5779c396e7ab411839fd8db`、`d61b2602f732e1045d32269f4847c3d5230533d8a930b8bbe501d493da35a60c`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- 自動測試只驗證 CodeMirror API 呼叫、transaction 與既有 DOM 生命週期；後續實體 iPhone 證明 `0.1.6` 未通過，因為 CodeMirror 的預設捲動還會推動 Obsidian 外層容器，把目標 Bullet 移到狀態列與 view header 下方

2026-08-10 完成 `0.1.7` 本機候選版自動驗證：

- 實體 iPhone 截圖固定 `0.1.6` 的失敗條件：聚焦三層 Bullet 且鍵盤開啟時，目標 Bullet、游標與 Breadcrumb 會一起被推到 Dynamic Island 與 Obsidian view header 下方，必須手動往上捲動才能繼續編輯
- 根因是 CodeMirror 預設 `scrollIntoView` 會沿著可捲動祖先往外處理，不只更新目前 editor 的 `.cm-scroller`
- 手機版改用插件私有的 scroll effect 與 post-layout measure；只有成功聚焦／返回父層／回到全文的 transaction 能建立 request，measure 只設定目前 `.cm-scroller.scrollTop`，完全不呼叫會沿祖先捲動的 CodeMirror 預設流程。桌面版不註冊這個手機 ViewPlugin
- 回歸測試確認進入深層 Bullet、逐層返回與最外層返回全文都只改變 editor scroller，外層 fixture 的 `scrollTop` 保持不變；返回全文會保留並定位完整多行 selection，過期 request 在 focus、selection 或文件已切換時不會寫入，且手機與桌面都沒有共享 `scrollHandler`
- `npm test`：73 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.7`
- 專用 `.test-vault` 已換入 `0.1.7` 三檔 bundle；`main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `b77afa8784478e1feb5b32344ddf81ba791b2e7e89f3e03501a5544037035225`、`0f4ba87c3bf5554aaee8cb93e41794e4abf41e6d4678ea256f4a0a0be5825944`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- 自動測試與桌面 DOM 不模擬實體 iOS visual viewport、鍵盤動畫與 Dynamic Island；`0.1.7` 發佈後仍須由實體 iPhone 複驗

2026-08-11 完成 `0.1.8` 驗證與發佈：

- 根因是插件用 capture click listener 攔截 Obsidian 的 `.collapse-indicator`，把收合箭頭當成 Zoom 入口，並阻止 Obsidian 繼續處理原生收合事件
- 已移除 fold indicator capture listener；marker click handler 也會明確排除 `.collapse-indicator`。收合箭頭交回 Obsidian，Bullet 圓點與 `Bullet Zoom: 聚焦目前的 Bullet Point` 命令維持 Zoom
- 回歸測試確認桌面 click、手機 tap、聚焦中的收合箭頭，以及收合控制巢狀在 marker DOM 內時，事件都不會被取消，focus session 與 selection 也不會被插件改變
- `npm test`：76 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `spectra analyze bullet-zoom-0-1-8`：Critical／Warning 為零，只有 4 個既有情境缺少具體範例的 Suggestion
- `spectra validate bullet-zoom-0-1-8 --strict`：通過
- `spectra-verify`：實作、測試、版本與 artifacts 對應一致；實體 iPhone 人工驗收 gate 保持未完成
- `spectra-audit`：Scoundrel、Lazy Developer、Confused Deputy 三種檢查均為 clean，Critical／High／Medium／Low finding 皆為零
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.8`
- 專用 `.test-vault` 已換入 `0.1.8` 三檔 bundle；`main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `b28bb02b677c94ddbd5ea0ba7cb347ee57415e3b0a031d8c948f7890baf95b38`、`222a45f0608800c7395900d71dabda62a8def483d19942c38f6b35bcde3b8c4a`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- 2026-08-11 在 macOS Obsidian `1.13.5` 實際操作 `0.1.8`：點擊 `Parent A` 收合箭頭會隱藏完整子 thread，再點一次會展開，過程不出現 Breadcrumb；用命令聚焦 `Parent A` 後，點擊 `Child A1` 收合箭頭只收合／展開該子 thread，Breadcrumb 仍維持 `Bullet Zoom Manual Test › Parent A`；`聚焦目前的 Bullet Point` 命令仍可正常 Zoom
- standalone commit `cd8d1cc` 已建立 [GitHub Release `0.1.8`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.8)；Actions run [`31501073765`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31501073765) 通過
- 從 Release 下載回讀的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `b28bb02b677c94ddbd5ea0ba7cb347ee57415e3b0a031d8c948f7890baf95b38`、`222a45f0608800c7395900d71dabda62a8def483d19942c38f6b35bcde3b8c4a`、`e589b0d7f383f16402e1c2ba2d227bb765d7c4e24262eb4ebc7446450fb75c24`，與 canonical build 逐檔一致
- 正式 Second Brain Vault 已透過 BRAT 更新至 `0.1.8`；安裝後的 `main.js`、`styles.css` 與 Release 逐 byte 一致，`manifest.json` 欄位內容一致但由 BRAT 壓成單行
- 同日在正式 Second Brain Vault 的 daily note 實測：`LINE` 的收合箭頭只收合／展開子項目，不出現 Breadcrumb；以命令聚焦 `LINE` 後，再點收合箭頭只切換子 thread，Breadcrumb 與 focus 保持不變；退出 Zoom 後已恢復展開狀態
- 桌面 `0.1.8` 已在測試 Vault 與正式 Vault 通過人工驗收；實體 iPhone 仍須透過 BRAT 更新再測，完成前不得宣稱手機實機 UX 通過

2026-08-12 完成 `0.1.9` 候選版驗證：

- 導覽改為 Bike 風格的輕量文字路徑：最左側 `‹` 一次返回上一層，筆記與父節點可直接跳回，目前層級改成不可點擊文字並以主題強調色底線標示
- 桌面路徑高度為 36 CSS px；手機保留 CodeMirror 正文 block、單列裁切與至少 44 × 44 CSS px 的操作區
- 聚焦時只隱藏目前 CodeMirror 編輯器頂層的 inline title 與非錯誤 Properties；其他 pane 與嵌入內容不受影響，退出後恢復
- 原生收合事件維持 `0.1.8` 分流：收合箭頭只收合／展開 thread，Bullet 圓點與命令才會 Zoom
- `npm test -- --run`：75 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `spectra analyze bullet-zoom-0-1-9-bike-navigation-ui`：Coverage、Consistency、Gaps 均為 clean；7 個 Ambiguity finding 都只是規格情境缺少額外具體範例的 Suggestion
- `spectra validate bullet-zoom-0-1-9-bike-navigation-ui --strict`：通過
- `spectra-verify`：10/10 tasks、2/2 requirements 與 16/16 scenarios 均有實作或測試證據，設計決策與既有 FocusSession 架構一致；實體 iPhone 幾何仍依設計保留為發佈前待驗 gate
- `spectra-audit`：Scoundrel、Lazy Developer、Confused Developer 三種檢查的最終複核皆為 clean，Critical／High／Medium／Low finding 均為零
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.9`
- 專用 `.test-vault` 已換入 `0.1.9` 三檔 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `1503affdfad61c1b172de805ed6d8171d176863c5ed6f0da04c65b59fd4aff76`、`938e6ff4d18faa8f20d081f2c979d9e86984ee8af1d89f13b7e9aee4987c0c76`、`d6c2e68d1d4fad9cee83811384247b747679ef61dd3697c84dd91a6b90f37f0b`
- 在 Obsidian `1.13.5` 專用 `.test-vault` 的淺色與深色主題實測：路徑順序、`‹` 上一層、筆記返回全文、目前層級底線、標題／Properties 隱藏與退出恢復均通過；AX tree 也確認目前層級是 container，其他路徑節點才是 button
- 桌面實測確認 Parent 收合箭頭會隱藏／展開完整子 thread，過程不建立 Breadcrumb，Markdown 原文仍為 213 characters
- Test Vault 主題已恢復為 `Adapt to system`，Obsidian 已切回 Second Brain；正式 Vault、GitHub Release、BRAT 公開版與實體 iPhone 皆尚未更新

2026-08-12 完成 `0.1.10` 驗證與發佈：

- 每個可聚焦的普通 Bullet 第一行尾端新增原生 `↳` 按鈕；目前聚焦根節點省略自己的按鈕，可見子節點仍能繼續往內聚焦
- 桌面版只在滑鼠 hover 該列或按鈕取得鍵盤焦點時顯示；文字游標所在的 active line 不再自動顯示，避免編輯畫面同時出現過多控制
- 手機與平板共用 mobile active-line 行為；只有目前編輯列的控制放大到至少 44 × 44 CSS px，其他隱藏控制維持 24 px，不會把每一列撐高
- 行尾控制直接由自己的即時 CodeMirror DOM 位置重新驗證 Bullet，不依賴可能被 Obsidian 收合箭頭取代的 marker DOM；插件以 WeakMap 驗證按鈕與 EditorView ownership，同 class 的外來 DOM 不會被誤攔截
- 收合箭頭仍完全交由 Obsidian 處理；行尾控制透過既有 focus transition 聚焦，不改 Markdown，也不主動展開或收合 thread
- `npm test -- --run`：85 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `spectra analyze bullet-zoom-0-1-10-inline-zoom-control`：Coverage、Consistency、Gaps 均為 clean；7 個 Ambiguity finding 都只是規格情境缺少額外具體 Example 的 Suggestion
- `spectra validate bullet-zoom-0-1-10-inline-zoom-control --strict`：通過
- `spectra-audit`：Scoundrel、Lazy Developer、Confused Deputy 三種檢查最終均為 clean，Critical／High／Medium／Low finding 皆為零
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.10`
- 專用 `.test-vault` 已換入 `0.1.10` 三檔 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `513bb18e95c9156b13b97312d4ab495dedfcb0cf1907c257e6b0b028a3a3830d`、`372d38265128b33705945e989b447acac3e6655f5754e604afc3a7c76505b9e5`、`7cc13442cd93bbe30909c35d0c09346c270807757618aafbfdf6cf9a769337c6`
- 在 macOS Obsidian `1.13.7` 專用 `.test-vault` 實際操作：第一層與巢狀行尾控制都能建立正確 Breadcrumb；收合中的 `Parent A` 仍保留原生收合狀態，透過相同 focus transition 聚焦後不改 Markdown，測試筆記維持 213 characters；淺色與深色主題的控制都使用 Obsidian theme tokens，不形成高彩度常駐按鈕
- [GitHub Release `0.1.10`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.10) 已發佈；Actions run [`31589412529`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31589412529) 通過，tag 指向已驗證的公開 main commit `067345e`
- Release 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `513bb18e95c9156b13b97312d4ab495dedfcb0cf1907c257e6b0b028a3a3830d`、`372d38265128b33705945e989b447acac3e6655f5754e604afc3a7c76505b9e5`、`7cc13442cd93bbe30909c35d0c09346c270807757618aafbfdf6cf9a769337c6`，與 canonical build 逐檔一致
- 實體 iPhone 與正式 Second Brain Vault 仍維持待更新／待複驗；手機／平板的 active-line、44 px 尺寸與無水平溢出目前只由 DOM／CSS 自動測試固定，不宣稱實機通過

2026-08-12 建立 `0.1.11` 候選版：

- 聚焦路徑移除重複的 `‹` 上一層按鈕；既有 `Bullet Zoom: 回到上一層 Bullet` 命令仍保留給快捷鍵與 Mobile Toolbar
- 目前聚焦根節點顯示 `↖` 行尾控制，點擊後直接回到全文；可見子節點維持 `↳` 往內聚焦，兩種控制都沿用 desktop hover／keyboard focus 與 mobile active-line 顯示規則
- 有 supported children 的 breadcrumb 顯示獨立 `›` menu trigger；桌面版使用多欄 cascade，手機與平板使用單欄 drill-down、44 px level-back 與受限高度垂直捲動
- hierarchy tree 由目前 CodeMirror `EditorState` 單次建立，不依賴 viewport DOM；menu 與控制都以 `EditorView` ownership 驗證，document、file、focus session 或 view 失效時會自動關閉
- `npm test`：94 項測試通過
- `npm run lint`：通過
- `npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.11`
- 專用 `.test-vault` 已換入 `0.1.11` 三檔候選 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `d7ff3630415f4b388edf1345a7008aebce2660155741736ba64171c5807ad739`、`f04fc2736308edd1f31301e505fd6460afdff603ddd5805cfe981c5b4914664f`、`b4690ac300dfba0660d60861cb620936438f26521d6b868f551ce9eca0a1899d`
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：desktop hover 會顯示行尾控制；原生收合不進入 Zoom；根節點 `↖` 能回到全文；breadcrumb 沒有 `‹` 或重複 `›`；多欄 cascade 可逐層展開、使用 Escape 關閉，選取 `Child A2` 後會直接切換聚焦；淺色與深色都正常；測試筆記維持 213 characters，SHA-256 維持 `952cd3f225c79422ae9935f8f859cc6b730ef85a06641d5d174e0e7d5e83d900`
- GitHub Release、正式 Second Brain Vault 更新與實體 iPhone 複驗仍待完成；手機 keyboard viewport、touch drill-down 與水平 overflow 不以桌面或 DOM 測試代替，目前公開 BRAT 版本仍為 `0.1.10`

`0.1.11` 沒有建立 Git tag 或 GitHub Release；實際 UX 試用後由下列 `0.1.12` 候選版取代。

2026-08-12 完成 `0.1.12` 驗證與發佈：

- breadcrumb 只保留可直接點擊的筆記與祖先，以及不可點擊的目前節點；移除所有 descendant trigger、hierarchy menu、cascade／drill-down controller 與相關 runtime CSS
- 行尾控制改為跟隨正文字級與行高的淡色 `↘`／`↖`；沒有固定尺寸、minimum size、padding、圓形底色、border radius、上下 margin 或透明放大 hit surface，避免撐高本列或覆蓋相鄰文字與原生收合控制
- 桌面只有該行 hover 或控制取得 `:focus-visible` 時顯示；手機與平板仍只有目前編輯行顯示。原生收合、Bullet 圓點、命令、退出與 pane ownership 維持分流
- `npm test`：89 項測試通過；`npm run lint`、`npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.12`
- 專用 `.test-vault` 已換入 `0.1.12` 三檔 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `593fd106239a49e9f36ef50f2c44125c84a1a0f8b0d829ec7b0ab6cc332247c0`、`1ea728a52101bc1931866c2d2232ade8d516104a62b5dab7a5cca548c1bd6aff`、`81b3df113ddc76b1049c3392da1d86f1e7dbc08a9a33fdb847b1831630343a17`
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：深層路徑只有筆記、Parent 與 Current，沒有下層選單；Parent breadcrumb 可直接返回；hover 時 `↘` 緊接文字尾端且不撐高 Bullet；原生 Fold more 只收起 thread、沒有建立 Breadcrumb；淺色與深色皆正常；驗收後畫面仍為 36 words、214 characters
- [GitHub Release `0.1.12`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.12) 已發佈並標記為 Latest；Actions run [`31601099269`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31601099269) 通過，tag 指向已驗證的公開 main commit `60d93a2`
- Release 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `593fd106239a49e9f36ef50f2c44125c84a1a0f8b0d829ec7b0ab6cc332247c0`、`1ea728a52101bc1931866c2d2232ade8d516104a62b5dab7a5cca548c1bd6aff`、`81b3df113ddc76b1049c3392da1d86f1e7dbc08a9a33fdb847b1831630343a17`，與 canonical build 逐檔一致
- 實體 iPhone 的列高、touch hit area、鍵盤 viewport 與捲動仍是獨立待驗 gate；目前公開 BRAT 版本已更新為 `0.1.12`，但不以自動測試或桌面驗收代替手機實機結果

2026-08-12 完成 `0.1.13` 驗證與發佈：

- 所有 `↘`／`↖` 改為常駐；runtime 已移除 `.is-mobile-active` 與依 selection 重建 mobile widget 的狀態，桌面、手機與平板都直接渲染每個可見支援 Bullet 的控制
- `button.bullet-zoom-row-control` 在 normal、hover、focus、focus-visible 與 active 狀態統一使用 `var(--text-faint)`、透明背景、無背景圖片、無陰影、0 padding、0 minimum size 與 1em 高；沒有透明放大 hit surface
- `npm test`：89 項測試通過；production CSS 測試以真實 `↘` glyph 確認淺／深色 theme token、透明互動狀態與較清楚的鍵盤 focus 外框，以及 jsdom 計算樣式中的有箭頭／無箭頭 line-height 皆為 28px；這項測試不具真實排版引擎，桌面視覺另以 Obsidian 人工驗收，手機實際幾何仍待實體 iPhone 複驗；`npm run lint`、`npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.13`
- 專用 `.test-vault` 已換入 `0.1.13` 三檔 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `354b0a9995c4ba66c5423cd9703c8e9c03dad3004bc1f00c623a2e012a6f1fca`、`a918900cdb244f23ec0657b58f0ec58c4009ac27a61dedc771c21537891c6f94`、`a8fb7bf9df270b5d783c7b5f73165e8f5c18b431d425560dc3ae86ece82f73e0`
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：全文狀態同時存在所有支援 Bullet 的常駐按鈕；`Parent A` 與 `Child A1` 的 `↘` 可逐層進入，聚焦根節點的 `↖` 可回到全文；Fold more／Fold less 只收合與展開原生 thread，沒有進入 Zoom；Light／Dark 都維持淡灰無填色控制；驗收後仍為 36 words、214 characters，測試筆記 SHA-256 維持 `d53d74283c75f72f50ce00dd233629277cbeef60aa3f043b539d085c31f1c0a8`
- [GitHub Release `0.1.13`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.13) 已發佈並標記為 Latest；Actions run [`31608117380`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31608117380) 通過，tag 指向已驗證的公開 main commit `fdedf5c`
- Release 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `354b0a9995c4ba66c5423cd9703c8e9c03dad3004bc1f00c623a2e012a6f1fca`、`a918900cdb244f23ec0657b58f0ec58c4009ac27a61dedc771c21537891c6f94`、`a8fb7bf9df270b5d783c7b5f73165e8f5c18b431d425560dc3ae86ece82f73e0`，下載後與 canonical build 逐檔 byte-identical
- 實體 iPhone 的點擊後行高、灰底、鍵盤 viewport 與捲動仍是獨立待驗 gate；公開 BRAT 已更新為 `0.1.13`，但不以自動測試或桌面驗收代替手機實機結果

2026-08-13 完成 `0.1.14` 自動驗證、桌面驗收與正式發布：

- 真實 CodeMirror fold-state 回歸先重現 `0.1.13` 的錯誤：folded parent 仍保留 placeholder，而且被 fold 蓋住的 `Child B` 控制會投影到 `…` 旁邊；Zoom 後 target fold 也沒有解除
- folded descendant 不再建立 marker 或行尾控制；fold state 改變時會重建 decorations，所以收合狀態只保留 parent 自己的 `↘`
- `enterFocusAt()` 會在同一筆 transaction 解除 target 第一行擁有的 fold，以及任何覆蓋 target marker 的祖先 fold，再套用 selection、focus 與手機捲動 intent；更深層獨立 fold 保留，退出後 target 維持展開，Markdown 不變
- 桌面 row control、手機 marker、命令、breadcrumb、巢狀 fold 與無 fold 路徑均使用同一 transition；原生 `.collapse-indicator` 的桌面、手機、聚焦中與巢狀事件仍完全交回 Obsidian
- `npm test`：97 項測試通過；其中包含「保留游標位置的 breadcrumb／上一層切換不會誤解開游標所在的更深 fold」，以及「游標位於祖先 fold 蓋住的子 Bullet 時，命令會先解除覆蓋 fold 再聚焦」回歸；`npm run lint`、`npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.14`
- 專用 `.test-vault` 已換入 `0.1.14` 三檔候選 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `6820896682677c443234101ffab73b5c917f25f2692f26d4f3b22c6047536125`、`0639e3fd82a4ef12ca79270cb801e6dee5b72dfe4d3761b48395fa23448ee94b`、`a8fb7bf9df270b5d783c7b5f73165e8f5c18b431d425560dc3ae86ece82f73e0`，逐檔 byte-identical
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：以原生 Fold more 收合 `Child A1` 時，只保留該列自己的 `↘`，被收合的孫節點沒有把額外控制投影到 `…` 旁；點擊 `↘` 後會先解除 target fold 再建立 `Bullet Zoom Manual Test > Parent A > Child A1` breadcrumb，畫面只有一個 `↖`、兩個孫節點維持向下排列，沒有 placeholder 或直排文字；退出後全文恢復且 target 維持展開；原生收合命令沒有進入 Zoom，驗收前後皆為 36 words、214 characters
- [GitHub Release `0.1.14`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.14) 已發佈並標記為 Latest；Actions run [`31643035633`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31643035633) 通過，tag 指向已驗證的公開 main commit `9771974`
- Release 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `6820896682677c443234101ffab73b5c917f25f2692f26d4f3b22c6047536125`、`0639e3fd82a4ef12ca79270cb801e6dee5b72dfe4d3761b48395fa23448ee94b`、`a8fb7bf9df270b5d783c7b5f73165e8f5c18b431d425560dc3ae86ece82f73e0`，與 canonical build 逐檔一致
- 公開 BRAT 已更新為 `0.1.14`；實體 iPhone 的 folded-target Zoom、點擊後行高、鍵盤 viewport 與捲動仍待獨立複驗，桌面人工驗收與自動測試不代替手機實機狀態

2026-08-13 完成 `0.1.15` 選單式 Bullet 切換候選版、桌面驗收與正式發布：

- Breadcrumb 最右側新增獨立的「切換 Bullet」按鈕；筆記、祖先、目前節點與 separator 維持原本角色，hover 或 activation 不會自行開啟選單
- 目前 Markdown 文件的所有支援 Bullet 會建立成 immutable outline tree；folded／offscreen 節點仍保留，重複 label 使用 marker anchor 區分，Heading、Task、編號、frontmatter 與 fenced code 排除
- 桌面使用 viewport-clamped 級聯欄位；手機與平板使用一次一層的 bottom sheet。文字會立即聚焦，`›` 只展開直屬子節點，`全文` 使用既有退出 transition
- 行尾 `↖` 改為一次只回到直接父 Bullet，最外層才返回全文；`↘`／`↖` 由 Widget 自己處理 native click，iPad 不再依賴 editor-container bubbling 或左側 Bullet marker
- 文件、檔案、focus session 或 EditorView 失效時只關閉所屬 pane 的選單；Escape／外部點擊會關閉並在 trigger 仍有效時恢復鍵盤焦點，所有 Markdown label 都以純文字插入
- `npm test -- --run`：154 項測試通過；包含完整 syntax tree、CommonMark `ListItem` ancestry、Obsidian HyperMD 單趟 hierarchy、lazy continuation branch、分割窗格 topmost lifecycle、桌面 resize、modal focus trap、`visualViewport` 鍵盤高度、三平台逐層 `↖`、iPad 非冒泡 activation，以及 detached／destroyed widget 回歸；`npm run lint -- --max-warnings=0`、`npm run build`、`git diff --check`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.15`
- 專用 `.test-vault` 已換入 `0.1.15` 三檔候選 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `473ac67c8789a723e4ff18d9d31a1ad34069315e6f16a51c29b01081ce31ab82`、`228d4bb82c98ab4b963eb9c9084b88b8b77d4ed6e83c9ae09f68e0db949fd299`、`a36e765fac1a859a8626394edd32e4eecb64bfdfb346f60e0447128f1eab208f`，逐檔 byte-identical
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：從 `Parent A` 開啟獨立「切換 Bullet」按鈕時，breadcrumb 維持純導航；選單先顯示兩個 root，`Parent A` 的 `›` 可展開 `Child A1`、`Child A2` 與下一層兩個 Grandchild，點擊 `Child A1` 文字會立即切換 focus 並關閉選單；另從 `Grandchild A1a` 的行尾 `↖` 實際依序返回 `Child A1`、`Parent A`、全文，每一層只顯示一個行尾反向控制；淺色與深色模式皆能讀取、Escape 可關閉、驗收前後皆為 36 words、214 characters
- 公開 pull request [`vizance/obsidian-bullet-zoom#3`](https://github.com/vizance/obsidian-bullet-zoom/pull/3) 已合併至 `main` commit `0e1de98`；[GitHub Release `0.1.15`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.15) 已發佈並標記為 Latest，Actions run [`31660633278`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31660633278) 通過
- Release 下載回讀的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `473ac67c8789a723e4ff18d9d31a1ad34069315e6f16a51c29b01081ce31ab82`、`228d4bb82c98ab4b963eb9c9084b88b8b77d4ed6e83c9ae09f68e0db949fd299`、`a36e765fac1a859a8626394edd32e4eecb64bfdfb346f60e0447128f1eab208f`，與 canonical build 逐檔 byte-identical；公開 BRAT 已可安裝 `0.1.15`
- `0.1.15` 發佈後的真實筆記試用判定失敗：桌面級聯選單會隨 Bullet 深度橫向增加固定寬度欄位，深層路徑超出 viewport，最右側節點無法可靠選取；這不是再補水平捲動或 viewport clamp 就能解決的單一 CSS 問題，因此不再延伸此資訊架構
- 實體 iPhone 的 bottom sheet、鍵盤 `visualViewport` 動畫、Light／Dark、folded target 與深層 drill-down，以及實體 iPad 的行尾單次 tap 未完成完整驗收，當次試用沒有留下精確 Obsidian／OS 版本；這些項目記為未驗證，不把自動測試、桌面 Test Vault 或 Release 資產驗證視為行動裝置實機通過
- 後續改版移至獨立 `0.1.16` Spectra change：以 Obsidian 原生 right sidebar View 取代浮動級聯選單，桌面保持面板開啟，手機／iPad 選取 Bullet 並 Zoom 後自動收起

2026-08-13 完成 `0.1.16` 原生 Bullet 大綱側邊欄候選版：

- 以 Obsidian 原生 right sidebar `ItemView` 取代 `0.1.15` 的桌面級聯選單、手機 bottom sheet、全域 backdrop、modal focus trap、`visualViewport` 定位與 document-level overlay stack；production source、bundle 與 CSS 都不再保留舊選單架構
- 大綱以單欄、可垂直捲動的 disclosure tree 呈現深層結構，並設有 128 層安全上限；縮排使用有上限的 depth class，文字可換行，沒有水平欄位或頁面 overflow。Disclosure 只管理展開狀態，label 才執行 Zoom；目前路徑會自動展開並以 `aria-current` 標示
- 同一個 sidebar 會跟隨最近使用的即時預覽 Markdown pane，也會跟著編輯器游標所在的支援 Bullet 自動展開父層、標示並捲到該節點；這個同步只更新側欄，不會 Zoom、改動 selection、fold 或 Markdown。游標不在支援 Bullet 上時，側欄回退到目前 Zoom 節點。文件、檔案、leaf、EditorView 或 anchor 失效時，舊 action 會安全失敗；文件編輯會 map 展開 anchor，分割窗格不會把 action 送到另一個 editor
- Breadcrumb 最右側原本的「切換 Bullet」按鈕已移除，路徑只保留全文與祖先導航。命令 `Bullet Zoom: 開啟 Bullet 大綱`、Ribbon `list-tree` 與 Obsidian 原生右側欄入口仍共用同一個 coordinator。桌面選取後聚焦來源 editor 並保留 sidebar；手機與平板選取後呼叫 Obsidian workspace 返回來源 leaf，由原生 drawer 負責收合
- `npm test -- --run`：178 項測試通過；包含五層單欄 tree、disclosure／label 分工、caret Bullet 同步、Enter 建立新 Bullet 後立即定位、1,000 列快速游標移動合併為最後位置、同文件 outline 快取、同 Bullet 內移動不重建、非 Bullet 時回退 Zoom 節點、Breadcrumb 無多餘 trigger、current path、空白與 hostile label、fold-aware focus、同 anchor stale action、文件編輯 anchor mapping、1,000 列輸入 debounce、隱藏 drawer 延後重建、輸入後捲動保留、同 source／同檔分割窗格重新定位、並行與 pane activation 開啟競態、跨視窗 timer 與焦點 ownership、pending 展開與捲動保留、深層線性建樹與 1,000 節點／128 層限制、鍵盤焦點、分割窗格、deferred ItemView、workspace／action failure、sidebar lifecycle、手機／平板返回來源 leaf，以及既有聚焦、fold、breadcrumb、行尾按鈕與捲動回歸；`npm run lint -- --max-warnings=0`、`npm run build`、`git diff --check`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.16`
- 專用 `.test-vault` 已換入 `0.1.16` 三檔候選 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `b89aaa7aa5abfa6512db3605c21fe402c04a8304758a4142886d87a605a1aa78`、`d77bf13c1e49e292df93b9743e94c330a608d06b0729067bb0dbf555009ddcc1`、`865b0474be7c9faa40384bdc883bd61860122c26e1ff0566a3eb4d7d492858cb`，逐檔 byte-identical
- private pull request [`vizance/chi_agent#6`](https://github.com/vizance/chi_agent/pull/6) 已合併至 `main` commit `d5c3913`；公開 pull request [`vizance/obsidian-bullet-zoom#5`](https://github.com/vizance/obsidian-bullet-zoom/pull/5) 已合併至 `main` commit `fd6a9b3`。[GitHub Release `0.1.16`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.16) 已發佈並成為 Latest，Actions run [`31684405809`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31684405809) 通過；重新下載三個 Release assets 後，SHA-256 與 canonical 候選檔逐檔一致，公開 `main` 的 `manifest.json` 版本也回讀為 `0.1.16`
- macOS Obsidian `1.13.7` 專用 `.test-vault` 實際操作：原生 right sidebar 可從 Ribbon 開啟；`Parent A > Child A1 > Grandchild A1a > Level four A1a > Level five A1a` 以單欄垂直 disclosure 逐層展開，最深 label 始終可選；disclosure 只改變側欄可見性，選取 `Level five A1a` 會建立完整 breadcrumb 並讓 editor 聚焦，側欄仍保持開啟；以原生 Fold more 收起祖先後，從側欄選取 `Grandchild A1a` 會解除覆蓋 fold 並顯示其分支；相鄰空白 Markdown pane 成為 active source 時，側欄切換為該 pane 的空狀態；Light／Dark 都清楚可讀。最新候選 bundle 另實測：全文狀態依序點擊正文 `Child A1` 與 `Grandchild A1a` 時，右側大綱會展開路徑並把 current 標示同步移到對應節點，過程沒有建立 Breadcrumb 或 Zoom；再以行尾 `↘` 進入 `Grandchild A1a` 後，Breadcrumb 只顯示筆記、`Parent A`、`Child A1` 與目前節點，沒有原本最右側的選單按鈕。先前驗收的測試 Markdown 檔 SHA-256 為 `618c13c8ea6c2d4f8d7897d4312f81a8d48789cf7a57a97e91879fde1e4f5fca`、52 words、303 characters；本輪 UI 操作未編輯文字，但未以該舊 hash 代替重新驗證。自動化控制無法可靠拖曳原生 sidebar divider，因此可調寬度仍未驗證，`4.3` 不標完成
- 實體 iPhone／iPad 的原生 drawer、深層 disclosure、選取後返回 editor、軟體鍵盤、行尾單次 tap 與 Light／Dark 仍待 BRAT 候選版發布後驗收；自動測試不代替實機結果

2026-08-13 完成 `0.1.17` 行尾箭頭顯示設定、精簡大綱標籤與正式發布：

- 「設定 → Bullet Zoom」新增「永遠顯示行尾縮放箭頭」。預設開啟，維持既有 `↘`／`↖` 常駐；關閉後，桌面只會在滑鼠移到該行或鍵盤聚焦按鈕時顯示。手機與 iPad 沒有可靠 Hover，因此兩種設定下都保持箭頭可見、可點
- 設定採嚴格 boolean，會先成功儲存再同步所有已開啟的 Markdown pane；儲存失敗會保留原本設定並顯示 Notice。後續新開的 editor 會直接使用已載入的設定，不必重啟 Obsidian
- 右側 Bullet 大綱改用 Markdown syntax tree 產生純文字標籤：粗體、斜體、刪除線、inline code、Markdown link 與 wiki link 的語法標記不再顯示，連結仍保留可讀名稱，HTML-like 內容只作為文字呈現
- 每個大綱標籤固定為單行 ellipsis。桌面可透過原生 Hover title 看完整文字；手機與 iPad 只有實際測量出文字溢位時才顯示淡色 `…`，點擊後以原生 `Bullet 全文` Modal 顯示完整純文字，不會 Zoom、移動游標、改 fold、改 Markdown 或切換 leaf
- `npm test -- --run`：211 項測試通過；`npm run lint -- --max-warnings=0`、TypeScript production build 與 `git diff --check` 通過。專用 `.test-vault` 已換入 `0.1.17` 三檔候選 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `fb4d3c89e7b8698328301fa1977c63c9a07ca154213cb06c15c336f96301a69c`、`3dd0cee1ba403e0c8310b105c03760eb0fff911ee09574c524a3ab48eacb7e29`、`9921e0e807bc6f1e07d131cdddfdca96aa76ce58f40cb80bb7439a2f3a0e43c2`，逐檔 byte-identical。macOS Hover 與實體 iPhone／iPad 的觸控、Modal、Light／Dark 均維持待驗，不以 jsdom 取代實機結果
- private pull request [`vizance/chi_agent#8`](https://github.com/vizance/chi_agent/pull/8) 與公開 pull request [`vizance/obsidian-bullet-zoom#7`](https://github.com/vizance/obsidian-bullet-zoom/pull/7) 均已合併；[GitHub Release `0.1.17`](https://github.com/vizance/obsidian-bullet-zoom/releases/tag/0.1.17) 已發佈並成為 Latest，Actions run [`31691319637`](https://github.com/vizance/obsidian-bullet-zoom/actions/runs/31691319637) 通過
- Release 下載回讀的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `fb4d3c89e7b8698328301fa1977c63c9a07ca154213cb06c15c336f96301a69c`、`3dd0cee1ba403e0c8310b105c03760eb0fff911ee09574c524a3ab48eacb7e29`、`9921e0e807bc6f1e07d131cdddfdca96aa76ce58f40cb80bb7439a2f3a0e43c2`，與 canonical build 逐檔 byte-identical；公開 BRAT 已可安裝 `0.1.17`

### 桌面版人工驗收

基準環境：macOS、Obsidian `1.13.5`；`0.1.10`～`0.1.14` 使用 Obsidian `1.13.7`、專用 `.test-vault`、即時預覽模式。

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
| `0.1.11` 行尾角色控制 | 通過 | hover 行顯示 `↳`；聚焦根節點顯示 `↖`，點擊後回到全文；單純文字游標不會讓所有行常駐顯示 |
| `0.1.11` 原生收合 | 通過 | 點擊 `Parent A` 收合箭頭只隱藏子分支，沒有 Breadcrumb、Zoom 或 Markdown 變更；重新展開後子分支恢復 |
| `0.1.11` Bike 式層級選單 | 通過 | 路徑不顯示 `‹`，層級間僅一個 `›`；桌面可開到 Parent／Child／Grandchild 三欄，無水平捲軸，並可用鍵盤 Escape 關閉、還原 trigger 焦點 |
| `0.1.12` 乾淨 Breadcrumb | 通過 | 深層聚焦只顯示筆記、Parent 與 Current；沒有 trigger 或 hierarchy menu，Parent 可直接返回上一層 |
| `0.1.12` 文字行尾箭頭 | 通過 | hover 的 `↘` 緊接 `Parent A` 文字尾端並沿用正文高度；沒有圓形背景或額外列高；`:focus-visible` 顯示另由 DOM／CSS 測試固定 |
| `0.1.12` 原生收合 | 通過 | 在 `Parent A` 執行 Obsidian `Fold more` 只隱藏子分支，沒有 Breadcrumb 或 Zoom；再執行 `Fold less` 後完整恢復 |
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
- `0.1.4` 實體 iPhone：未通過；鍵盤關閉時 compact Breadcrumb 仍位於 Dynamic Island 與 Obsidian view header 上方
- `0.1.5` 實體 iPhone：部分通過；Breadcrumb 位置已正常，但聚焦三層最內節點後仍需收起鍵盤並手動往上捲動
- `0.1.6` 實體 iPhone：未通過；focus request 會連 Obsidian 外層容器一起捲動，把目標 Bullet 推到手機頂端介面下方
- `0.1.7` 本機候選版：focus／退出的 editor-only 捲動、外層位置不變與桌面不註冊手機 ViewPlugin 已由自動測試固定；待發佈與實體 iPhone 複驗

#### `0.1.7` 手機 editor-only 捲動回歸紀錄

測試以三層 `Parent`／`Child`／`Grandchild` 驗證手機進入最內節點後，插件私有的 scroll effect 會在 CodeMirror 更新 DOM 後提出 measure request，把 `.cm-scroller.scrollTop` 設為目標行頂端減去 52 CSS px Breadcrumb 預留，外層容器維持原本的 `scrollTop`。最外層 Bullet 返回全文時也由相同私有流程把保留的單一游標或多行 selection 置中於 editor；若 measure 前 focus、selection 或文件已更新，舊 request 會失效。手機與桌面都不註冊共享 `scrollHandler`，其他 CodeMirror 功能不會被攔截。這能固定「不再推動 Obsidian 外層畫面」的程式條件，但仍不模擬實體 iOS visual viewport、鍵盤動畫與 Dynamic Island。

#### `0.1.6` 手機聚焦自動定位回歸紀錄

測試以三層 `Parent`／`Child`／`Grandchild` 驗證手機進入最內節點後，會直接呼叫 CodeMirror 的 `scrollIntoView`，把新 focus anchor 設為 `y: start` 並預留 52 CSS px；再點擊最近父層時，新的 `Child` anchor 也會取得同樣 request。桌面執行相同聚焦流程不產生插件自有的自動定位 request。後續實體 iPhone 證明這只固定了捲動意圖，沒有約束 CodeMirror 不得繼續捲動外層祖先，因此保留為失敗歷史，不代表手機定位正確。

#### `0.1.5` 手機正文 block 回歸紀錄

`.is-phone` 測試把 header／safe-area 補償放在 `.cm-scroller`，確認 compact Breadcrumb 位於同一個 scroller 內，且在 focused branch 第一行之前。手機不建立 Bullet Zoom `.cm-panels-top` 子項，也不在 `EditorView.scrollDOM` 前方插入 sibling；動態開關其他 top panel 時，Breadcrumb 仍留在正文捲動內容，其他 panel 維持 CodeMirror 原本位置。另有測試確認 `全文`、父層、聚焦失效與 view destroy 正常建立、更新與清除 block。桌面版仍使用原本的 top panel。這仍是 DOM 結構測試，不代表實體 iPhone 幾何已通過。

#### `0.1.4` 手機頂端定位回歸紀錄

測試在同一個 CodeMirror editor 同時建立 Bullet Zoom Breadcrumb 與另一個 top panel，也涵蓋先聚焦、再動態開啟與關閉其他 panel 的順序。在 `.is-phone` 下，只有 Breadcrumb 會移到 `EditorView.scrollDOM` 前方；另一個 panel 留在 `.cm-panels-top`。後續實體 iPhone 證明這項測試固定了錯誤的成功條件：`scrollDOM` sibling 雖不再 sticky，仍繞過 `.cm-scroller` 的正文 padding 與手機安全位置補償。因此 `0.1.4` 回歸紀錄只保留為失敗歷史，不代表手機定位正確。

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

Canonical source 位於私人工作區的 `000_Agent/tools/obsidian-bullet-zoom/`。公開 GitHub repo 是由這個子資料夾產生的發佈鏡像，不是另一份獨立維護的程式碼。

### Spectra 版本規則

- `0.1.0`～`0.1.6` 的既有歷史統一封存在 `2026-08-10-add-obsidian-bullet-zoom-plugin`，不回溯拆成多個 change。
- 從 `0.1.7` 開始，每個預計發佈的版本必須先建立唯一對應的 Spectra change，命名固定為 `bullet-zoom-X-Y-Z`，例如 `0.1.7` 對應 `bullet-zoom-0-1-7`。
- 同一個 change 不得再加入下一個版本。若某版本發佈後實機驗收失敗，先在該 change 記錄失敗並完成／封存，再為修正版建立下一個版本 change。
- 版本號、程式碼、測試、README、GitHub tag／Release 與實機驗收都由同一個版本 change 追蹤；未完成的版本 change 保持 active。

```bash
npm install
npm test
npm run lint
npm run build
```

正式安裝只需要建置後的 `main.js`、`manifest.json` 和 `styles.css`。建立與 `manifest.json` 同版本的 Git tag 後，GitHub Actions 會建立或更新同名 Release，並附上這三個檔案。
