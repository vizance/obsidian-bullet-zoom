## 1. 共用的分支改寫基礎

- [x] 1.1 抽出共用的分支改寫函式，供貼上與拖曳共用：在 `src/list-structure.ts` 匯出 `rewriteBranchToTarget`，輸入分支原文、來源基準縮排、目標縮排文字、目標標記樣式，輸出改寫後的多行文字，並讓 `planListPaste` 改為呼叫它。驗證：`tests/list-structure.test.ts` 既有的貼上案例在不修改任何預期值的前提下全部通過。
- [x] 1.2 Rewrite the dropped branch to match the target list 的編號規則成立：`rewriteBranchToTarget` 在目標為編號清單時，依縮排層級從 1 重新編號，父層前進時重設較深層；目標為條列清單時每行都改用目標的 bullet 字元。驗證：在 `tests/list-structure.test.ts` 新增案例，斷言條列分支落入編號清單得到 `1.`、`\t1.`、`\t2.`，以及編號分支落入條列清單每行都是 `-`。

## 2. 落點規劃純函式

- [x] 2.1 Resolve the drop gap from the pointer position：在新檔 `src/branch-drop-plan.ts` 實作 `resolveDropGap`，輸入目標 `EditorState`、文件位置與「指標在該行上半或下半」，回傳含上方項目與下方項目（可為 null）的間隙描述；行不是支援項目時回傳 null。驗證：`tests/branch-drop-plan.test.ts` 斷言上半取上方間隙、下半取下方間隙、非清單行回傳 null。
- [x] 2.2 用間隙加合法深度範圍決定落點，而不是「放在某個項目上」，實作 Restrict drop depth to the legal indent set for the gap：`candidateIndents` 回傳由淺到深、去重的合法縮排文字陣列，上界是上方項目縮排加一個縮排單位，下界是下方項目縮排，上方不存在時只剩下方縮排，下方不存在時下界為空字串。驗證：`tests/branch-drop-plan.test.ts` 以 spec 的四種間隙表格案例斷言結果陣列，另加一組空白縮排文件確認回傳的是文件原本的縮排文字而非 tab。
- [x] 2.3 落點規劃是純函式，跨文件用文字交換：`planBranchDrop` 在同文件時回傳 `{ kind: 'same-document', changes }`，跨文件時回傳 `{ kind: 'cross-document', removal, insertAt, insertText }`，並內建 Reject illegal drops without changing any document 的判斷（來源非支援項目、分支範圍取不到、間隙落在來源分支內、目標有 focus session 而間隙在範圍外）一律回傳 null。驗證：`tests/branch-drop-plan.test.ts` 對每一種拒絕條件各一個案例斷言回傳 null，並對同文件與跨文件各斷言一次回傳形狀。

## 3. 拖曳控制器

- [x] 3.1 Start a branch drag from a supported list marker，且拖曳環境以介面注入，讓控制器可測、手勢門檻沿用側邊欄的既有常數：在新檔 `src/branch-drag-controller.ts` 實作 `attachBranchDragController`，以 `.bullet-zoom-marker` 上的 pointerdown 起始，滑鼠 8px、觸控長按 350ms、長按前位移 10px 取消，拖曳結束後在捕捉階段吞掉一次 click，並接受可注入的環境介面（依螢幕座標解析目標編輯器、查詢目標是否可寫、套用計畫）。驗證：`tests/branch-drag-controller.test.ts` 以假環境斷言未達門檻不拖曳且不吞 click、達門檻進入拖曳、觸控長按起拖、長按前捲動取消、pointercancel 後文件未變更。
- [x] 3.2 Choose the indent nearest to the pointer's horizontal position，實作水平位移對應到最接近的合法縮排：控制器把每個合法縮排換算成螢幕 x 座標（目標行左緣加上縮排字元數乘以量測到的單一縮排寬度），選最接近指標者，等距時取較淺；同一間隙內的水平移動不重算間隙。驗證：`tests/branch-drag-controller.test.ts` 以固定的假座標斷言向右移動改選較深縮排、等距時選較淺、同一間隙內水平移動不觸發間隙重算。
- [x] 3.3 Show a drop indicator that previews the resulting position and depth，並依指示線用 CSS 自訂屬性定位：控制器在目標編輯器內插入一條指示線，只透過 `--bullet-zoom-drop-left` 與 `--bullet-zoom-drop-top` 兩個自訂屬性定位，拖曳結束、取消或無合法落點時移除。驗證：`tests/branch-drag-controller.test.ts` 斷言指示線只設定這兩個自訂屬性且沒有其他 inline style、選定縮排改變時只有 left 自訂屬性變動、取消後指示線被移除。

## 4. 接上編輯器與 Obsidian

- [x] 4.1 Move the branch into the drop position within one document：在 `src/focus-extension.ts` 掛上控制器並在同文件落點時以單次 dispatch 套用刪除與插入，落地後游標移到搬移後分支第一行。驗證：`tests/branch-drag-controller.test.ts` 斷言同文件落點只呼叫一次 dispatch，並在 `tests/branch-drop-plan.test.ts` 斷言套用該組 changes 後的文件內容與游標位置。
- [x] 4.2 Move the branch across panes and files，採用跨文件先插入後刪除：在 `src/main.ts` 注入環境實作，優先以 `EditorView.findFromDOM` 解析指標下的編輯器，回傳 null 時走訪 Obsidian workspace 的 Markdown leaf 比對 DOM 包含關係，並拒絕 `ownerDocument` 不同的 popout 目標；套用時先對目標 dispatch 插入，成功後才對來源 dispatch 刪除，插入失敗兩份文件都不動，刪除失敗保留插入結果並跳一則 Notice。驗證：`tests/branch-drag-controller.test.ts` 以假環境斷言插入先於刪除的呼叫順序、插入失敗時來源未被呼叫、刪除失敗時發出 Notice、popout 目標不解析出編輯器。
- [x] 4.3 拖曳中的來源行與指示線有可被主題覆寫的樣式：在 `styles.css` 定義拖曳中狀態與指示線的類別，指示線的 left 與 top 讀自 3.3 的兩個自訂屬性。驗證：手動在雙 pane 開啟 Live Preview 拖曳一次，確認指示線可見且左緣隨縮排移動。

- [x] 4.4 Leave the radial menu its only entry point when it needs one：拖曳手勢與既有的 `MarkerPointerPlugin` 共用同一組 marker 指標事件，而不是另外掛一組監聽；滑鼠起拖門檻與 `PRESS_CANCEL_PX` 對齊為 12px；觸控長按只有在輪盤選單由點擊開啟時才起拖，選單靠長按開啟時觸控拖曳停用。驗證：`tests/focus-extension.test.ts` 斷言點擊開選單時長按進入拖曳且選單未開、長按開選單時長按仍開選單且未進入拖曳、滑鼠移動 16px 兩種設定下都進入拖曳。

- [x] 4.5 Hide the text caret while a branch is being dragged：拖曳期間視窗內所有編輯器的游標隱藏且不可選取文字，來源編輯器的 contentDOM 失焦，結束（放開或取消）時還原；沿用輪盤選單既有的 `caret-color: transparent` 做法，透過 `body` 層的類別套用，讓另一個 pane 的游標也一起隱藏。驗證：`tests/branch-drag-controller.test.ts` 斷言起拖時呼叫 setCaretSuspended(true)、取消與放開時呼叫 (false)；`tests/mobile-compatibility.test.ts` 斷言 `styles.css` 有對應的 caret 規則。

## 5. 驗證與交付

- [x] 5.1 樣式契約有回歸保護：在 `tests/mobile-compatibility.test.ts` 加入斷言，確認 `styles.css` 含拖曳中狀態類別、指示線類別與兩個自訂屬性的宣告。驗證：執行 vitest 該檔案通過。
- [x] 5.2 專案三道檢查通過：執行 npm test -- --run、npm run lint、npm run build。測試全綠、lint 0 error、build 重新產生 `main.js`。lint 的既有 warning（main.ts 的 API 棄用與測試檔未使用的 import）在這個 change 之前就存在，數量不得因本次改動增加。驗證：比對改動前後的 warning 數量相同、lint 無 error、確認沒有殘留 console 輸出。
- [ ] 5.3 請使用者完成自動測試無法涵蓋的實機驗證並回報結果：桌面雙 pane 跨檔案拖曳、iPhone 長按拖曳且一般捲動不受影響、Live Preview 與原始碼模式下指示線位置正確。驗證：使用者逐項回覆通過或失敗，未回報前不得宣稱功能已在實機驗收。
