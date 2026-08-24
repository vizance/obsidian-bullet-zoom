## Context

Bullet Zoom 用縮排欄位與正規表示式理解清單結構，不依賴 Obsidian 的語法樹節點做行為判斷（AGENTS.md 明列這條，過去多個 bug 來自違反它）。既有可重用的基礎：

- `findSupportedBullet` 依 `markerDetectionFacet` 的 `bullets` / `numbered` 判斷一行是不是可操作的清單項目。
- `computeBranchRange` 取出一個項目連同其子樹的字元範圍。
- `planBranchMove` 已經能把分支搬到目標的前後，但只換成目標的縮排文字，不能指定階層，也只在同一份文件內。
- `planListPaste` 已經會把貼入的分支改寫成目標清單的標記樣式並重新編號。
- `.bullet-zoom-marker` 裝飾已存在於編輯器內，單擊會 Zoom（`activateBulletMarker`）。
- 側邊欄 `attachOutlineDragController` 已經有一套指標拖曳流程：滑鼠位移 8px 起拖、觸控長按 350ms、`pointercancel` 復原、拖曳結束吞掉後續 click。

這個 change 要在編輯器內加上同一套手勢，並把落點從「前 / 後」升級成「前 / 後 + 階層」，同時允許目標在同一個 Obsidian 視窗的另一個 pane。

## Goals / Non-Goals

**Goals:**

- 編輯器內以清單標記為握把拖曳整個分支，且不破壞既有的單擊 Zoom。
- 水平位移決定落地階層，放開前就能從指示線看出結果。
- 同一個 Obsidian 視窗內跨 pane、跨檔案搬移。
- 條列與編號清單共用同一條路徑，是否可拖完全由既有標記辨識設定決定。
- 落地後標記樣式與編號符合目標清單。

**Non-Goals:**

- 側邊欄大綱與編輯器互相拖曳。側邊欄維持現有的同檔案 before / after 行為，另開 change 處理。
- 跨 Obsidian popout 視窗拖曳。popout 是另一個 `document`，指標事件不會跨過去。
- 拖曳時的邊緣自動捲動。
- 拖曳非清單內容（段落、標題、表格）。
- 把跨檔案搬移合併成單一 undo。Obsidian 每份檔案各自維護 undo 堆疊，這裡不自建跨檔案交易。
- 修改既有的 `planBranchMove` 呼叫端行為。

## Decisions

### 用間隙加合法深度範圍決定落點，而不是「放在某個項目上」

指標位置先由 `posAtCoords` 換成目標文件的一行，再依指標落在該行矩形的上半或下半，決定要插入的「間隙」。一個間隙由上方項目 A 與下方項目 B 定義（任一可能不存在）。

合法縮排集合的規則：

- 上界是 A 的縮排文字再加一個縮排單位，也就是成為 A 的第一個子項目。
- 下界是 B 的縮排文字。若插得比 B 淺，B 會被吸進被搬動的分支底下，改變了使用者沒有碰的內容，因此禁止。
- A 不存在（間隙在第一個項目之前）時，縮排固定為 B 的縮排。
- B 不存在（間隙在清單尾端）時，下界是最外層縮排（空字串）。

集合以「縮排文字」表示而非數字深度，因為文件可能混用 tab 與空白，直接沿用來源文件既有的縮排文字才不會把使用者的縮排風格改掉。集合由 A 的祖先鏈縮排文字（含 A 自己）加上「A 的縮排 + 一個縮排單位」組成，再濾掉比 B 淺的項目，由淺到深排序。

替代方案是像側邊欄那樣只做 before / after，實作簡單但無法搬進或搬出子層，使用者仍得手動調縮排，等於沒解決原本的痛點。

### 水平位移對應到最接近的合法縮排

每個候選縮排都換算成一個螢幕 x 座標：取目標行的行首座標，加上「候選縮排字元數 × 單一縮排寬度」。單一縮排寬度由目標編輯器實際量測（行首與內容起點的座標差除以該行縮排單位數），量測失敗時退回讀取 `.cm-content` 的 `ch` 寬度。選擇 x 座標與指標最接近的候選，相同距離時取較淺的。

替代方案是用固定的 CSS 像素常數，但主題與字型會改變縮排寬度，實際量測才穩。

### 抽出共用的分支改寫函式，供貼上與拖曳共用

把 `planListPaste` 內部的標記樣式改寫與編號重算抽成 `rewriteBranchToTarget`，輸入是分支原文、來源基準縮排、目標縮排文字、目標標記樣式，輸出改寫後的多行文字。`planListPaste` 改為呼叫它，行為不變（既有 `list-structure` 測試必須維持綠燈）。新的落點規劃再呼叫同一個函式。

替代方案是在拖曳裡複製一份改寫邏輯，會產生兩套編號規則，日後必然分歧。

### 落點規劃是純函式，跨文件用文字交換

新增 `src/branch-drop-plan.ts`，不 import Obsidian。核心函式接受來源 `EditorState`、來源錨點、目標 `EditorState`、目標間隙與選定縮排，回傳兩種結果之一：

- 同一份文件：一組 `ChangeSpec`，供單次 `dispatch` 使用，因此是一次 undo。
- 不同文件：來源端的刪除 `ChangeSpec`，加上目標端的插入位置與插入文字。

跨文件不共用 `ChangeSpec` 陣列，因為兩份文件的位置座標系不同，混用會寫錯位置。

### 跨文件先插入後刪除

跨檔案搬移先對目標編輯器 dispatch 插入，確認成功後才對來源編輯器 dispatch 刪除。若插入失敗就整個放棄，來源不動；若刪除失敗，使用者會看到重複的一份內容而不是內容消失。資料重複可以手動修掉，資料消失不行。

### 拖曳環境以介面注入，讓控制器可測

新增 `src/branch-drag-controller.ts`，控制器本身不直接呼叫 Obsidian 或 `document.elementFromPoint`，而是接受一組環境介面：依螢幕座標解析出目標編輯器、查詢目標編輯器是否可寫、套用落點計畫。正式執行時由 `src/main.ts` 注入實作，解析目標編輯器優先用 `EditorView.findFromDOM`，回傳 null 時退回走訪 Obsidian workspace 的 Markdown leaf 比對 DOM 包含關係。測試以假的環境驅動控制器，不需要真的 CodeMirror 排版。

### 指示線用 CSS 自訂屬性定位

落點指示線是覆蓋在編輯器上的一個元素，位置必須依指標即時變動。依 AGENTS.md 不直接寫 `element.style.foo`，改用 `style.setProperty` 設定 `--bullet-zoom-drop-left` 與 `--bullet-zoom-drop-top`，實際的 `left` / `top` 與外觀寫在 `styles.css`，主題仍可覆寫。這與 `src/radial-menu.ts` 與 `src/settings.ts` 既有的自訂屬性做法一致。

### 手勢門檻沿用側邊欄的既有常數

滑鼠位移 8px 起拖、觸控長按 350ms、長按前位移超過 10px 視為捲動而取消。與側邊欄一致，使用者不必記兩套手感，也避免在編輯器裡誤觸拖曳而蓋掉單擊 Zoom。

## Implementation Contract

**行為**

- 在編輯器內按住一個支援的清單標記並移動超過門檻後，該標記所屬的整個分支進入拖曳狀態，來源行套上拖曳中的樣式。
- 拖曳期間，指標所在編輯器內顯示一條水平指示線，位於將插入的間隙，左緣對齊將採用的縮排。指標在合法縮排範圍內左右移動時，指示線左緣跟著跳到最接近的候選縮排。
- 放開後分支被搬到指示線的位置與階層，游標移到搬移後分支的第一行。
- 指標放開時若沒有合法落點，不修改任何文件。
- 拖曳結束後緊接著的 click 事件被吞掉，不會觸發 Zoom。位移未達門檻就放開時，維持既有的單擊 Zoom。
- 目標可以是同一視窗內任一個 Markdown 編輯器 pane，包含不同檔案。
- 落地後分支每一行的標記改用目標清單的標記樣式；目標是編號清單時，落地分支依層級重新編號。
- 標記是否可拖，與 `markerDetectionFacet` 判定該行是否為支援項目完全一致。關閉 Zoom numbered items 時，編號項目既不能被拖，也不能當落點。

**介面與資料形狀**

- `rewriteBranchToTarget`（`src/list-structure.ts` 匯出）：輸入分支原文、來源基準縮排文字、目標縮排文字、目標標記樣式，回傳改寫後文字。`planListPaste` 改為呼叫它。
- `resolveDropGap`（`src/branch-drop-plan.ts`）：輸入目標 `EditorState` 與一個文件位置加上下半判定，回傳間隙描述，含上方項目與下方項目（可為 null）。
- `candidateIndents`：輸入目標 `EditorState` 與間隙，回傳由淺到深、去重的合法縮排文字陣列。無合法落點時回傳空陣列。
- `planBranchDrop`：輸入來源 `EditorState`、來源錨點、目標 `EditorState`、間隙、選定縮排文字，回傳 `{ kind: 'same-document', changes }` 或 `{ kind: 'cross-document', removal, insertAt, insertText }`，非法時回傳 null。
- `attachBranchDragController`（`src/branch-drag-controller.ts`）：輸入來源 `EditorView` 與環境介面，回傳解除掛載函式。環境介面至少包含依螢幕座標解析目標編輯器、判斷目標是否可寫、以及套用計畫三個方法。

**失敗模式**

以下情況一律回傳 null 或不套用變更，且不顯示指示線、不跳通知：

- 來源錨點不是支援的清單項目，或 `computeBranchRange` 回傳 null。
- 同一份文件內，落點間隙落在來源分支範圍之內。
- 目標行不是支援的清單項目。
- 目標編輯器唯讀，或不是 Markdown 編輯器。
- 目標編輯器的 `ownerDocument` 與來源不同（popout 視窗）。
- 目標編輯器有作用中的 focus session，而間隙不在該 session 的範圍內。

跨文件插入成功但刪除失敗時，顯示一則 Obsidian 通知說明來源分支未被移除，這是唯一會對使用者出聲的失敗。

**驗收條件**

- `tests/branch-drop-plan.test.ts` 覆蓋：同層前插、同層後插、成為上方項目的子項目、從子層拖回外層、拖到清單尾端最外層、第一個項目之前只允許單一縮排、落點在自身分支內被拒、混用 tab 與空白時沿用目標縮排文字、編號分支落入條列清單改成條列、條列分支落入編號清單重新編號、關閉 numbered 偵測時編號行不可當來源或落點。
- `tests/branch-drag-controller.test.ts` 覆蓋：位移未達門檻視為點擊不拖曳、達門檻後產生指示線、水平移動改變選定縮排、觸控長按起拖、長按前捲動取消、`pointercancel` 復原且不改文件、跨編輯器落點呼叫跨文件套用路徑、目標唯讀時不套用、插入成功而刪除失敗時發出通知。
- `tests/list-structure.test.ts` 既有貼上案例維持綠燈，證明抽出 `rewriteBranchToTarget` 沒有改變貼上行為。
- `tests/mobile-compatibility.test.ts` 斷言 `styles.css` 內存在拖曳中、指示線、自訂屬性的類別契約，且沒有新的 inline style。
- `npm test -- --run`、`npm run lint -- --max-warnings=0`、`npm run build` 三者皆通過。
- 實機驗證項目（自動測試無法涵蓋，須由使用者確認）：桌面雙 pane 跨檔案拖曳、iPhone 長按拖曳與捲動不衝突、Live Preview 與原始碼模式下指示線位置正確。

**範圍邊界**

- 在範圍內：編輯器內拖曳手勢、階層落點計算、同文件與跨文件搬移、標記樣式與編號改寫、共用改寫函式的抽出、對應樣式與測試。
- 不在範圍內：側邊欄拖曳的任何修改、popout 視窗、邊緣自動捲動、非清單內容拖曳、跨檔案單一 undo、新增設定開關。

## Risks / Trade-offs

- 拖曳手勢與編輯器既有的文字選取、單擊 Zoom、行動版標記放大搶事件 → 只在 `.bullet-zoom-marker` 上的 `pointerdown` 起始，滑鼠沿用 8px 門檻、觸控沿用 350ms 長按，並在拖曳結束後於捕捉階段吞掉一次 click，與側邊欄同一套規則。
- Live Preview 的行渲染與測試環境不同，座標換算可能失準 → 全部走 `posAtCoords`、`coordsAtPos` 與量測值，不讀裝飾 DOM 結構，也不依賴語法樹節點。
- 跨檔案搬移是兩次 dispatch，中途失敗會不一致 → 先插入後刪除，最壞情況是內容重複並跳通知，不會遺失。
- 深層縮排的候選縮排彼此相距不到幾像素，使用者難以精準選取 → 取最接近者並在相同距離時偏淺，指示線即時反映選擇，放開前可自行修正。
- 抽出 `rewriteBranchToTarget` 可能改變既有貼上行為 → 以既有貼上測試為回歸護欄，抽出時不得修改測試預期值。
- 大檔案拖曳時每次 `pointermove` 都重算候選 → 候選只在間隙改變時重算，同一間隙內的水平移動只做距離比較。
