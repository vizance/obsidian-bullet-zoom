## Summary

Bullet 大綱依筆記中的 Markdown 標題（H1–H6）分區：標題顯示為不可點擊的視覺標頭，各區內的頂層 Bullet 編號從 1 重新起算。

## Motivation

使用者的筆記常用標題（如 Raw Ideas、Outline、Output）劃分區塊，各區底下再放 Bullet。目前大綱把全部頂層 Bullet 連續編號（第二區從 11 號起跳），看不出區塊歸屬。標題入列後，大綱結構與筆記畫面一致，編號也回到每區自己的順序。

## Proposed Solution

- 新增標題掃描：逐行解析 ATX 標題（`#` 到 `######`），略過 frontmatter 與 fenced code block 內的行，產出（層級、文字、位置）清單。
- 大綱 model 增加 `headings` 欄位；渲染時把頂層 Bullet 依位置分組到最近的前一個標題之下；第一個標題之前的 Bullet 維持無標頭的第一組。
- 標頭列為純視覺元素：不可點擊、無 hover 效果、aria-hidden 以外仍提供語意（以 heading role 或純文字呈現，不進入 Tab 順序）；依層級套用縮排或字級差異。
- 每組頂層編號從 1 重新起算（`1.`、`2.`…），巢狀編號規則不變；沒有任何標題的筆記行為與現狀完全相同。
- 沒有 Bullet 的標題照樣顯示，忠實反映筆記結構。

## Non-Goals

- 標頭不可點擊、不可摺疊、不參與 Zoom 與目前節點判定。
- 不支援 Setext 標題（底線式 `===`／`---`）。
- 不改動聚焦頁、麵包屑與編輯器行為。

## Impact

- Affected specs: `openspec/specs/bullet-outline-switcher/spec.md`
- Affected code:
  - Modified: `src/list-structure.ts`
  - Modified: `src/outline-sidebar-view.ts`
  - Modified: `styles.css`
  - Modified: `tests/list-structure.test.ts`
  - Modified: `tests/outline-sidebar-view.test.ts`
  - Modified: `manifest.json`
  - Modified: `package.json`
  - Modified: `package-lock.json`
  - Modified: `versions.json`
  - Modified: `main.js`
  - Modified: `README.md`
