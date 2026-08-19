## Problem

Bullet 選單被硬性限制在手機與平板：`Platform.isMobile` 為假時整個功能不註冊，而且圓點的處理器對 `pointerType === 'mouse'` 直接跳過。這原本是刻意的——當初只要手機版。

但 1.26.0 讓大綱列的編號可以開選單，那條路徑沒有這道限制，於是桌面版變成半開狀態：大綱能開選單、編輯器不能。同一個功能在同一台機器上有兩種答案。

## Proposed Solution

- 新增設定讓桌面版也能從編輯器的圓點開啟選單，預設關閉，維持既有使用者的行為不變。
- 設定開啟時，滑鼠點擊圓點與手機點擊圓點走同一條路徑，遵守同一個「圓點點擊」選擇。
- 設定關閉時，滑鼠完全不會開啟選單，圓點只做 Zoom，和現在一樣。
- 手機與平板不受這個設定影響，永遠可用。

## Non-Goals

- 不改變選單的版面、尺寸、插槽與手勢。
- 不為桌面另外設計鍵盤或右鍵入口。

## Success Criteria

- 桌面版預設行為不變：點圓點只 Zoom。
- 開啟設定後，桌面版點圓點會開啟選單。
- 手機與平板行為完全不受影響。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Modified: `src/focus-extension.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/focus-extension.test.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
