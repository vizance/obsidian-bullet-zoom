# Bullet Zoom

Bullet Zoom 是一款 Obsidian 插件，讓你在即時預覽模式裡聚焦某一個普通 Bullet Point，繼續編輯該節點與它的所有子節點。聚焦只改變目前編輯窗格的顯示範圍，不會改寫或刪除 Markdown 原文。

## 目前狀態

- 目前開發版本：`0.1.13`
- 目前公開 BRAT 版本：`0.1.12`
- 最低 Obsidian 版本：`1.11.7`
- 桌面版人工驗收：`0.1.13` 已於 2026-08-12 在 Obsidian `1.13.7` 專用 `.test-vault` 驗證常駐淡灰箭頭、`↘` 進入、`↖` 退出、原生收合、淺／深色與 Markdown 字數不變；production CSS 自動測試另固定計算樣式契約；正式 Vault 仍維持已安裝的 `0.1.8`
- 手機版自動驗收：`0.1.13` 以真實 `↘` widget、production CSS 與淺／深色 theme token 測試固定所有箭頭常駐、透明互動狀態，以及有箭頭／無箭頭的計算行高相同；這不代表實體 iPhone 已通過
- 實體手機驗收：`0.1.6` 未通過；聚焦三層 Bullet 時會把外層編輯畫面推到狀態列與 view header 下方。`0.1.13` 本機候選版的 editor-only 捲動、收合／Zoom 分流、常駐箭頭與點擊後行高仍待實體 iPhone 複驗
- 正式 Vault：已於 2026-08-11 透過 BRAT 更新到 `0.1.8`，桌面實際操作通過；實體 iPhone 待複驗

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

桌面版和手機版都使用同一個 repo。若手機的 Vault 已透過 Obsidian Sync 同步設定，也可以直接在手機的 BRAT 加入同一個路徑。目前最新 GitHub Release 是 `0.1.12`，可直接透過 BRAT 更新。實體手機更新與複驗完成前，不宣稱手機 UX 已正式通過。

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
- 正式 Vault 已透過 BRAT 更新至 `0.1.8`；安裝後的 `main.js`、`styles.css` 與 Release 逐 byte 一致，`manifest.json` 欄位內容一致但由 BRAT 壓成單行
- 同日在正式 Vault 的 daily note 實測：`LINE` 的收合箭頭只收合／展開子項目，不出現 Breadcrumb；以命令聚焦 `LINE` 後，再點收合箭頭只切換子 thread，Breadcrumb 與 focus 保持不變；退出 Zoom 後已恢復展開狀態
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
- Test Vault 主題已恢復為 `Adapt to system`，Obsidian 已切回 Vault；正式 Vault、GitHub Release、BRAT 公開版與實體 iPhone 皆尚未更新

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
- 實體 iPhone 與正式 Vault 仍維持待更新／待複驗；手機／平板的 active-line、44 px 尺寸與無水平溢出目前只由 DOM／CSS 自動測試固定，不宣稱實機通過

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
- GitHub Release、正式 Vault 更新與實體 iPhone 複驗仍待完成；手機 keyboard viewport、touch drill-down 與水平 overflow 不以桌面或 DOM 測試代替，目前公開 BRAT 版本仍為 `0.1.10`

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

2026-08-12 完成 `0.1.13` 本機候選版驗證：

- 所有 `↘`／`↖` 改為常駐；runtime 已移除 `.is-mobile-active` 與依 selection 重建 mobile widget 的狀態，桌面、手機與平板都直接渲染每個可見支援 Bullet 的控制
- `button.bullet-zoom-row-control` 在 normal、hover、focus、focus-visible 與 active 狀態統一使用 `var(--text-faint)`、透明背景、無背景圖片、無陰影、0 padding、0 minimum size 與 1em 高；沒有透明放大 hit surface
- `npm test`：89 項測試通過；production CSS 測試以真實 `↘` glyph 確認淺／深色 theme token、透明互動狀態與較清楚的鍵盤 focus 外框，以及 jsdom 計算樣式中的有箭頭／無箭頭 line-height 皆為 28px；這項測試不具真實排版引擎，桌面視覺另以 Obsidian 人工驗收，手機實際幾何仍待實體 iPhone 複驗；`npm run lint`、`npm run build`：通過
- `manifest.json`、`package.json`、`package-lock.json`、`versions.json` 版本均對齊 `0.1.13`
- 專用 `.test-vault` 已換入 `0.1.13` 三檔 bundle；canonical 與 Test Vault 的 `main.js`、`manifest.json`、`styles.css` SHA-256 分別為 `354b0a9995c4ba66c5423cd9703c8e9c03dad3004bc1f00c623a2e012a6f1fca`、`a918900cdb244f23ec0657b58f0ec58c4009ac27a61dedc771c21537891c6f94`、`a8fb7bf9df270b5d783c7b5f73165e8f5c18b431d425560dc3ae86ece82f73e0`
- macOS Obsidian `1.13.7` 專用 `.test-vault` 人工驗收通過：全文狀態同時存在所有支援 Bullet 的常駐按鈕；`Parent A` 與 `Child A1` 的 `↘` 可逐層進入，聚焦根節點的 `↖` 可回到全文；Fold more／Fold less 只收合與展開原生 thread，沒有進入 Zoom；Light／Dark 都維持淡灰無填色控制；驗收後仍為 36 words、214 characters，測試筆記 SHA-256 維持 `d53d74283c75f72f50ce00dd233629277cbeef60aa3f043b539d085c31f1c0a8`
- 實體 iPhone 的點擊後行高、灰底、鍵盤 viewport 與捲動仍是獨立待驗 gate；GitHub Release 與公開 BRAT 目前仍為 `0.1.12`

### 桌面版人工驗收

基準環境：macOS、Obsidian `1.13.5`；`0.1.10`～`0.1.13` 使用 Obsidian `1.13.7`、專用 `.test-vault`、即時預覽模式。

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

Canonical source 位於私人工作區的 `obsidian-bullet-zoom/`。公開 GitHub repo 是由這個子資料夾產生的發佈鏡像，不是另一份獨立維護的程式碼。

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
