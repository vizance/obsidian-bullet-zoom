## Problem

1.7.0 的 Bullet 滑動手勢與 1.8.0 的抽屜邊緣守門在實機都難以使用：手勢與 Obsidian 行動版的原生操作互相干擾，即使把抽屜限制在邊緣，一般的捲動、選取與抽屜開啟仍受到影響。

## Root Cause

橫向滑動在 Obsidian 行動版已經被原生抽屜佔用，且抽屜的判定範圍涵蓋整個工作區。任何在編輯區攔截橫向滑動的做法，都必須壓制原生手勢，因而破壞使用者既有的操作直覺。這是手勢通道本身的衝突，不是參數調整可以解決的問題。

## Proposed Solution

- 移除滑動手勢與抽屜守門的全部實作：刪除 `src/swipe-gestures.ts`、其測試，以及 `src/main.ts` 內的手勢擴充、剪貼簿輔助、動作分派與守門生命週期。
- 移除 `Swipe gestures` 設定區塊與六個相關設定鍵，其餘設定與行為不變。
- 保留 `planBulletPrefixToggle` 與 `collectBulletCopyText` 兩個純文件操作函式與其測試：它們與手勢無關，是通用的 Bullet 操作，後續的選單式操作會直接沿用。
- 文件移除滑動手勢與抽屜守門的章節。

## Non-Goals

- 不改動聚焦、大綱、拆分、自動整理等其他功能。
- 不保留任何橫向滑動的攔截程式碼。
- 不在此變更中加入替代的操作入口。

## Success Criteria

- 編輯器內的橫向滑動完全回到 Obsidian 原生行為，抽屜可在原本的範圍內開啟。
- 設定頁不再出現 `Swipe gestures` 區塊。
- 原始碼中沒有殘留未使用的手勢或守門程式碼。

## Impact

- Affected specs: `openspec/specs/bullet-focus-navigation/spec.md`
- Affected code:
  - Removed: `src/swipe-gestures.ts`
  - Removed: `tests/swipe-gestures.test.ts`
  - Modified: `src/settings.ts`
  - Modified: `src/main.ts`
  - Modified: `tests/settings.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
  - Modified: `README.zh-TW.md`
