# bullet-focus-navigation Specification

## Purpose

Define how Bullet Zoom recognizes supported unordered-list items, isolates and navigates one focused branch per editor, preserves Markdown and fold ownership, and exposes desktop and mobile navigation controls.

## Requirements

### Requirement: Recognize supported plain unordered-list items

The plugin SHALL recognize a Markdown list item only when its syntax-tree node is a list marker, its source marker is `-`, `*`, or `+` followed by whitespace, and the content is not a task checkbox. The plugin SHALL NOT treat numbered items, task items, fenced-code text, frontmatter text, or non-list paragraphs as supported items.

#### Scenario: Recognize each supported marker

- **WHEN** Live Preview contains the source lines `- Alpha`, `* Beta`, and `+ Gamma`
- **THEN** the marker for each line is available for Bullet Zoom focus

##### Example: marker classification

| Source line | Classification |
| --- | --- |
| `- Alpha` | supported |
| `* Beta` | supported |
| `+ Gamma` | supported |
| `1. Delta` | unsupported |
| `- [ ] Epsilon` | unsupported |
| `- [x] Zeta` | unsupported |

#### Scenario: Reject list-like text inside fenced code

- **WHEN** the text `- Not a list` appears inside a fenced code block
- **THEN** the plugin does not decorate its hyphen as a focus marker and the focus command does not enter focus from that line

#### Scenario: Reject list-like text inside frontmatter

- **WHEN** the text `- Not a list` appears as a YAML sequence inside frontmatter
- **THEN** the plugin does not decorate its hyphen as a focus marker and the focus command does not enter focus from that line


<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Enter focus through marker or command

In Live Preview, the plugin SHALL enter focus for a supported item when the user clicks or taps its decorated `.bullet-zoom-marker`, activates its trailing `.bullet-zoom-enter-control`, or runs the `bullet-zoom-focus-current` command with the cursor inside that item. The plugin SHALL append one role-specific trailing control immediately after the first-line content of each visible supported Bullet: the current focus anchor SHALL render an exit control with a faint up-left arrow `↖`, and every other supported visible Bullet SHALL render an enter control with a faint down-right arrow `↘`. Each arrow SHALL remain visible on desktop, phone, and tablet without pointer hover, keyboard focus, text-cursor placement, or active-line selection. Each arrow SHALL derive its normal color from Obsidian's theme-aware faint text color, inherit the surrounding editor font family and size, and keep its own glyph box no taller than `1em`.

Each control SHALL remain a native button with a role-specific accessible name derived from the Bullet label and SHALL support standard keyboard activation. Its normal-flow box SHALL have zero padding, zero vertical margin, no fixed or minimum width, no minimum height, a `1em` height cap matching the inherited text size, no rounded container, and no background image, fill, or shadow in normal, hover, focus, focus-visible, active, or tapped states. Keyboard focus indication SHALL use a more visible theme-aware token than the normal faint arrow without changing normal-flow geometry. Rendering or interacting with the control SHALL NOT increase the Bullet line's computed height, create horizontal scrolling, overlap editable text, or cover the native collapse indicator. The plugin SHALL NOT add an invisible activation surface larger than the visible glyph.

While a fold is active, the plugin SHALL omit marker and row-control decorations for descendant Bullet positions replaced by that fold, so the folded owner row retains one enter control and the fold placeholder does not project hidden descendant controls. The plugin SHALL rebuild those decorations when fold state changes. Every successful marker, enter-control, command, or breadcrumb focus transition SHALL inspect the target item's active CodeMirror fold ranges before applying Bullet Zoom. The transition SHALL remove each fold owned by the target item's first line and each ancestor fold whose replacement covers the target marker, SHALL leave folds that begin on descendant lines unchanged, and SHALL apply unfolding, focus, selection, and existing phone scroll intent in one editor transaction. Enter-control activation SHALL resolve the control's live editor position, use this shared focus transition, move the selection to the end of the selected item's first line, and SHALL NOT change Markdown. Exit-control activation SHALL use the existing explicit exit transition, return to the complete note, retain the current editor selection, preserve the target's expanded state, and SHALL NOT change Markdown or alter any fold still active at exit.

The plugin SHALL NOT treat an activation originating from an Obsidian `.collapse-indicator` as marker, enter-control, or exit-control activation, including when the collapse indicator is nested inside marker DOM, and SHALL leave that event unprevented for Obsidian's native fold or unfold handling. Collapse-indicator activation SHALL preserve the current Bullet Zoom focus session and editor selection. Marker activation SHALL move the selection to the end of the selected item's first line before focus is applied. On phones, every successful focus or refocus SHALL request a post-layout start-aligned scroll target for the newly focused item with more vertical margin than the compact breadcrumb's 44 CSS-pixel minimum height, so that the breadcrumb and first line are visible together without dismissing the software keyboard or manually scrolling. Desktop focus SHALL retain its existing scroll position behavior.

#### Scenario: Enter through desktop marker click

- **WHEN** a desktop user clicks the decorated marker for an unfolded supported item outside any collapse indicator
- **THEN** that item becomes the focused item and the cursor is placed at the end of its first line

#### Scenario: Enter a folded desktop parent through the trailing control

- **WHEN** a desktop parent Bullet owns an active fold and the user activates its persistently visible trailing enter control
- **THEN** the target fold is removed in the focus transaction, the parent becomes the focused item, its cursor moves to the end of the first line, its Markdown remains unchanged, its descendants flow downward, and its root renders one exit control without a target fold placeholder or duplicate enter control

#### Scenario: Suppress controls for folded descendants

- **WHEN** a parent Bullet owns an active fold that replaces two supported descendant Bullet rows
- **THEN** the parent retains one trailing enter control and neither hidden descendant contributes a marker or row control beside the fold placeholder

#### Scenario: Enter a folded phone parent

- **WHEN** a phone parent Bullet owns an active fold and the user activates its marker or trailing enter control
- **THEN** the same target-owned and target-covering unfold transition runs before focus and the existing phone scroll request, while folds beginning on descendant lines remain active

#### Scenario: Preserve an independently folded descendant

- **WHEN** both a parent Bullet and one of its descendant Bullets own active folds and the user focuses the folded parent
- **THEN** the parent-owned fold is removed and the descendant-owned fold remains active

#### Scenario: Keep controls persistently visible across platforms

- **WHEN** supported Bullet rows render on desktop, phone, or tablet before and after pointer hover, cursor movement, selection changes, or focus changes
- **THEN** every row retains its role-specific trailing arrow without requiring an active-line class and each control remains interactive

#### Scenario: Match faint gray in light and dark themes

- **WHEN** Obsidian renders the row controls under either its light theme or dark theme
- **THEN** each arrow uses the active theme's faint text color and every control interaction state retains a transparent background and no shadow

#### Scenario: Keep the mobile arrow within text line geometry

- **WHEN** a mobile Bullet renders its real row-end arrow beside an otherwise identical Bullet line without an arrow and the control enters focus or active state
- **THEN** both lines retain the same computed line height, the arrow uses the inherited editor font size inside a `1em`-capped glyph box, and the visible button contributes no padding, minimum dimensions, rounded background, shadow, or vertical margin to normal layout

#### Scenario: Enter through keyboard activation

- **WHEN** a desktop keyboard user moves focus to a supported Bullet's trailing enter control and presses Enter or Space
- **THEN** that Bullet becomes focused through the same transition as pointer activation

#### Scenario: Exit through the focus-root control

- **WHEN** a Bullet is the current focus anchor and the user activates its up-left trailing control
- **THEN** focus clears, the complete note becomes visible, the editor selection remains at its retained position, Markdown remains unchanged, the focus target remains expanded, and every other active fold remains unchanged

#### Scenario: Distinguish focus-root and descendant controls

- **WHEN** a focused branch renders the current focus root and supported visible descendants
- **THEN** the focus root renders one `↖` exit control with an exit-specific accessible name, while each unfolded descendant renders one `↘` enter control with an enter-specific accessible name

#### Scenario: Enter through mobile marker tap

- **WHEN** a mobile user taps the decorated marker for an unfolded supported item outside any collapse indicator
- **THEN** that item becomes the focused item through the same click behavior and the cursor is placed at the end of its first line

#### Scenario: Preserve desktop collapse behavior before focus

- **WHEN** a desktop user clicks an Obsidian `.collapse-indicator` for a supported parent item while Bullet Zoom focus is clear
- **THEN** Bullet Zoom leaves the event unprevented for native handling and preserves the clear focus session and current selection

#### Scenario: Preserve mobile collapse behavior before focus

- **WHEN** a mobile user taps an Obsidian `.collapse-indicator` for a supported parent item while Bullet Zoom focus is clear
- **THEN** Bullet Zoom leaves the event unprevented for native handling and preserves the clear focus session and current selection

#### Scenario: Preserve collapse behavior during focus

- **WHEN** Bullet Zoom focus is active and the user activates a visible `.collapse-indicator`
- **THEN** Bullet Zoom leaves the event unprevented and preserves the existing focus anchor and current selection

#### Scenario: Ignore nested collapse indicator as a Zoom marker

- **WHEN** an Obsidian `.collapse-indicator` is nested inside DOM carrying `.bullet-zoom-marker` and the user activates the collapse indicator
- **THEN** Bullet Zoom does not enter, switch, or exit focus and leaves the event unprevented for native handling

#### Scenario: Enter a folded item through command palette or assigned shortcut

- **WHEN** the cursor is inside a folded supported item and the user runs `bullet-zoom-focus-current` from the command palette, a user-assigned desktop hotkey, or the mobile toolbar
- **THEN** every active fold covering the target marker and the target-owned fold are removed, that item becomes visible as the focused item through the shared transition, and folds that begin on descendant lines remain active

#### Scenario: Refocus a folded nested item

- **WHEN** focus is active and the user activates the marker, trailing enter control, or breadcrumb for a folded visible descendant item outside any collapse indicator
- **THEN** the descendant-owned fold is removed, the descendant becomes the new focused item, and its branch becomes the visible branch

#### Scenario: Reveal a deeply nested mobile focus immediately

- **WHEN** a phone user with the software keyboard open focuses the innermost item of a three-level Bullet branch near the top of the current viewport
- **THEN** the compact breadcrumb and the focused item's first line are both brought into the editor viewport without keyboard dismissal or manual scrolling


<!-- @trace
source: bullet-zoom-0-1-14
updated: 2026-08-13
code:
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
-->

---
### Requirement: Isolate the focused branch while preserving editing

While focus is active, the editor SHALL show the focused item's complete first line, its indented continuation lines, and its descendant items. The editor SHALL hide content before the focused item and content after the branch boundary. The branch boundary SHALL be the first later nonblank line whose indentation is equal to or smaller than the focused item's indentation, with trailing blank lines before that boundary excluded.

#### Scenario: Show one nested branch

- **WHEN** the user focuses `- Child A` in the following note
- **THEN** the visible source range consists of `- Child A`, `  - Grandchild`, and `    Detail`, while `- Parent`, `  - Child B`, and `After list` are hidden

##### Example: branch boundary

```markdown
- Parent
  - Child A
    - Grandchild
      Detail
  - Child B
After list
```

#### Scenario: Keep internal blank lines

- **WHEN** a focused branch contains a blank line followed by a nonblank line indented deeper than the focused item
- **THEN** the blank line and the deeper-indented line remain visible

#### Scenario: Exclude trailing blank lines before a sibling

- **WHEN** one or more blank lines occur between the focused branch's last nonblank line and the next item at the same indentation
- **THEN** those trailing blank lines are outside the visible branch

#### Scenario: Recompute after a structural edit

- **WHEN** the user adds, removes, indents, or outdents lines while focus is active
- **THEN** the visible branch and breadcrumb chain are recomputed from the edited document in the same transaction sequence

#### Scenario: Preserve normal editing and undo

- **WHEN** the user edits text or creates a nested supported item inside the focused branch and then invokes Obsidian undo
- **THEN** Obsidian records and reverses the document edit normally while Bullet Zoom updates only its view state


<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Navigate with per-editor breadcrumbs

The plugin SHALL render Bike-inspired navigation scoped to the current editor pane and derived from its active focus session. The visual path SHALL NOT contain a dedicated previous-level action, and no note, ancestor, current-location, or separator element SHALL act as a descendant-menu trigger. The navigation container SHALL contain one independent outline-switcher button after the path while focus is active. The existing `bullet-zoom-focus-parent` command SHALL remain available for user-assigned hotkeys and Mobile Toolbar actions. Desktop SHALL render the current note, every supported ancestor from outermost to innermost, and the current focused item in a complete path inside a top editor panel. Mobile SHALL render one compact CodeMirror block immediately before the focused branch, containing a `全文` note entry, only the immediate parent entry when a Bullet parent exists, the current item in the remaining path width, and the independent outline-switcher button.

The note and ancestor labels SHALL remain actionable buttons with full accessible labels and tooltips. Activating the note label SHALL return to the complete note, and activating an ancestor label SHALL focus that ancestor directly. The current item label SHALL remain a non-interactive text element, the only path label marked with `aria-current="location"` and the plugin-owned current-state class, and SHALL use a subtle accent indicator with normal theme text instead of an accent-filled button. Pointer hover, keyboard focus, tap, or click on any breadcrumb path element SHALL NOT reveal a child arrow, descendant list, cascading column, drill-down view, or hierarchy popup. Only explicit activation of the separate outline-switcher button SHALL open hierarchy navigation.

#### Scenario: Display the full Bike-inspired desktop path with a separate switcher

- **WHEN** the current note is `Ideas.md` and the focused item is `Grandchild` under `Parent` and `Child`
- **THEN** the desktop bar displays `Ideas`, `Parent`, `Child`, and `Grandchild` in that order, displays no dedicated previous-level action, and displays one independent `切換 Bullet` button after the path

#### Scenario: Represent the current location without an actionable label

- **WHEN** the desktop bar displays `Ideas`, `Parent`, `Child`, and `Grandchild`
- **THEN** the `Grandchild` label is a non-button element with `aria-current="location"` and subtle accent styling, while the `Ideas`, `Parent`, and `Child` labels remain neutral actionable buttons

#### Scenario: Keep breadcrumb hover free of descendant menus

- **WHEN** a desktop pointer hovers the note entry, an ancestor entry, the current entry, or a separator
- **THEN** no child arrow or hierarchy navigation appears and the breadcrumb path remains unchanged

#### Scenario: Keep breadcrumb activation limited to the selected path entry

- **WHEN** the user activates a note or ancestor breadcrumb label
- **THEN** the plugin navigates directly to that selected path level without opening or rendering the outline switcher

#### Scenario: Open hierarchy only from the independent trigger

- **WHEN** the user explicitly activates the `切換 Bullet` button
- **THEN** the plugin opens the adaptive outline switcher without changing the breadcrumb labels, current focus anchor, selection, or Markdown

#### Scenario: Retain previous-level command navigation

- **WHEN** `Grandchild` is focused under `Parent` and `Child` and the user runs `bullet-zoom-focus-parent` from an assigned shortcut or Mobile Toolbar action
- **THEN** `Child` becomes focused even though the visual breadcrumb path has no dedicated previous-level button

#### Scenario: Move the row-end reverse control back one Bullet level

- **WHEN** `Grandchild` is focused under `Parent` and `Child` and the user activates the visible row-end `↖` control
- **THEN** `Child` becomes focused, one `↖` remains at the end of the `Child` row, and the complete note does not appear

#### Scenario: Exit from an outermost Bullet through the row-end reverse control

- **WHEN** an outermost `Parent` Bullet is focused and the user activates its visible row-end `↖` control
- **THEN** focus clears and the complete note appears

#### Scenario: Activate a row-end control directly on iPad

- **WHEN** an iPad user taps the visible row-end `↘` or `↖` native button once
- **THEN** the corresponding focus or immediate-parent transition occurs without requiring the editor row to become active first and without requiring activation of the left-side Bullet marker

#### Scenario: Keep row-end control activation independent of editor bubbling

- **WHEN** a native click reaches a plugin-owned row-end button but does not bubble to the CodeMirror editor container
- **THEN** the button still performs the same validated focus transition, retains keyboard click support, and does not create a second visible control

#### Scenario: Show a compact root-level path on mobile

- **WHEN** a mobile user focuses a root-level item with a label wider than a 315 CSS-pixel viewport
- **THEN** the row shows `全文`, the current item, and one independent outline-switcher button, truncates the current label with an ellipsis, retains its full accessible label, displays no dedicated previous-level action, and does not scroll horizontally

#### Scenario: Navigate through the compact mobile path

- **WHEN** a mobile user focuses `Grandchild` under `Parent` and `Child`
- **THEN** the visible row shows `全文`, `Child`, `Grandchild`, and the outline-switcher button, and activating `Child` refocuses `Child` and updates the row to show `全文`, `Parent`, `Child`, and the same switcher button

#### Scenario: Preserve mobile breadcrumb touch targets

- **WHEN** the compact mobile path appears with the software keyboard open
- **THEN** the actionable `全文`, immediate-parent, and outline-switcher buttons retain minimum 44-by-44 CSS-pixel targets, the current label uses the remaining width, and the row stays within the editor-pane width without overlapping editable text

#### Scenario: Focus an ancestor

- **WHEN** the user activates the `Parent` breadcrumb label
- **THEN** the parent item becomes focused and its complete branch becomes visible

#### Scenario: Return to the complete note

- **WHEN** the user activates the note breadcrumb label
- **THEN** focus clears, navigation and the outline-switcher trigger disappear, and the complete note becomes visible

#### Scenario: Represent an empty item

- **WHEN** a breadcrumb item has no text after its marker
- **THEN** its visible and accessible label is `（空白節點）`

---
### Requirement: Keep focus transient and isolated by editor pane

The plugin SHALL store focus state only in the current CodeMirror editor instance. It SHALL NOT write focus state to Markdown, plugin data, workspace layout, or synchronized settings.

#### Scenario: Keep split panes independent

- **WHEN** the same note is open in two split panes and the user focuses an item in the first pane
- **THEN** the first pane shows that branch and the second pane continues to show its prior independent state

#### Scenario: Clear focus when a pane loads another note

- **WHEN** a focused editor pane changes from one file path to another
- **THEN** focus clears in that pane before the new note is displayed as focused content

#### Scenario: Clear focus after plugin or application restart

- **WHEN** Bullet Zoom reloads, the plugin is disabled and re-enabled, or Obsidian restarts
- **THEN** every editor starts with the complete note visible

#### Scenario: Clear an invalidated target

- **WHEN** an edit deletes the focused marker or converts it into a numbered item, task item, fenced-code line, or non-list paragraph
- **THEN** focus clears silently and the user's document edit remains intact


<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Exit focus explicitly

The plugin SHALL provide the `bullet-zoom-exit` command whenever a Markdown editor is active. Running the command during focus SHALL show the complete note, remove the breadcrumb panel, retain the current selection, and scroll that selection into view. On phones, this exit scroll SHALL move only the current editor's `scrollDOM`; it MUST NOT scroll an ancestor Obsidian container or the window.

#### Scenario: Exit active focus

- **WHEN** the user runs `bullet-zoom-exit` while a branch is focused
- **THEN** the complete note returns and the retained cursor or selection is scrolled into view

#### Scenario: Keep phone exit scrolling inside the editor

- **WHEN** a phone user returns from a root Bullet to the complete note while the software keyboard is open
- **THEN** the retained cursor or active selection endpoint is brought into the current editor viewport while all ancestor scroll containers retain their previous positions

#### Scenario: Exit when focus is already clear

- **WHEN** the user runs `bullet-zoom-exit` while the complete note is already visible
- **THEN** the document and selection remain unchanged and no error notice appears

---
### Requirement: Preserve Markdown during view-state actions

Entering focus, changing focus through a breadcrumb, and exiting focus SHALL NOT change the Markdown document. Only explicit user editing inside the normal Obsidian editor SHALL create document changes.

#### Scenario: Compare source before and after navigation

- **WHEN** the user enters focus, navigates to an ancestor, and exits without typing
- **THEN** the complete Markdown source after exit is byte-for-byte identical to the source before entry

#### Scenario: Retain edits made while focused

- **WHEN** the user changes text inside the focused branch and exits focus
- **THEN** the user's text change remains in the complete note and no hidden content is removed or rewritten


<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Fail safely outside supported Live Preview context

The plugin SHALL perform focus interactions only in Live Preview. Unsupported commands and adapter failures SHALL leave the document, selection, and prior focus state unchanged while providing the specified Traditional Chinese notice.

#### Scenario: Focus command in Source mode

- **WHEN** the user runs `bullet-zoom-focus-current` in Source mode
- **THEN** focus does not change and the notice `Bullet Zoom 第一版只支援即時預覽模式。` appears

#### Scenario: Focus command outside a supported item

- **WHEN** the user runs `bullet-zoom-focus-current` in Live Preview with the cursor outside a supported item
- **THEN** focus does not change and the notice `請先把游標放在一般 Bullet Point 裡。` appears

#### Scenario: Command adapter cannot access the editor view

- **WHEN** the Obsidian editor command callback does not expose a dispatchable CodeMirror editor view
- **THEN** the document and focus state remain unchanged and the notice `無法取得目前的 Obsidian 編輯畫面。` appears

#### Scenario: Unsupported marker activation

- **WHEN** the user clicks or taps a numbered-list marker, task checkbox, paragraph, fenced-code marker, or frontmatter marker
- **THEN** Bullet Zoom performs no action and shows no notice


<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Provide a mobile-compatible focus interface

The plugin manifest SHALL set `isDesktopOnly` to `false`, and runtime code SHALL NOT import Node.js or Electron APIs. Mobile breadcrumb controls SHALL use a minimum 44-by-44 CSS-pixel touch target and SHALL fit in one non-scrolling row. On phones, Bullet Zoom SHALL NOT create a breadcrumb top panel or a sibling before `.cm-scroller`; it SHALL render the compact breadcrumb as a CodeMirror-managed block immediately before the focused branch so the navigation and editable branch share the scroller's content padding, scrolling, view-header offset, and safe-area coordinate space. While focus is active on desktop or mobile, the plugin SHALL hide the inline note title and non-error Properties only in the focused editor pane. It SHALL restore them when focus exits, becomes invalid, switches file, or the editor view is destroyed. Other editor panes SHALL remain unchanged.

#### Scenario: Load the same bundle on desktop and mobile

- **WHEN** Obsidian loads `main.js`, `manifest.json`, and `styles.css` on desktop or mobile
- **THEN** Bullet Zoom initializes without a platform-specific runtime dependency error

#### Scenario: Keep focused content next to navigation

- **WHEN** a desktop or mobile user focuses an item in a note that has an inline title and Properties
- **THEN** the focused pane hides the inline title and non-error Properties and places the editable focused branch immediately below navigation

#### Scenario: Keep the compact path below phone chrome with the keyboard closed or open

- **WHEN** Bullet focus is active on a physical phone before or after the software keyboard opens and the visual viewport shifts
- **THEN** the compact path remains inside the same padded scrolling content as the focused branch, below the iOS safe area and Obsidian view header, and does not overlap the status area, Dynamic Island, or header controls

#### Scenario: Restore pane chrome after focus

- **WHEN** focus exits, becomes invalid, the pane opens another file, or its editor view is destroyed
- **THEN** the pane no longer has the focused presentation state and its inline title and Properties render normally

#### Scenario: Keep other panes unchanged

- **WHEN** one pane is focused while another Markdown pane is visible
- **THEN** only the focused pane hides its inline title and non-error Properties

#### Scenario: Hide marker interaction outside Live Preview

- **WHEN** the same note is shown in Source mode or Reading view
- **THEN** Bullet Zoom does not expose a clickable or tappable focus marker in that view

---
### Requirement: Distribute an installable BRAT release

The plugin SHALL be published from a standalone GitHub repository whose root contains `manifest.json`. Every published plugin version SHALL have a GitHub Release containing assets named exactly `main.js`, `manifest.json`, and `styles.css`, and those assets MUST match the verified canonical build.

#### Scenario: Install the current release through BRAT

- **WHEN** BRAT resolves the standalone repository and selects release `0.1.1`
- **THEN** it can download `main.js`, `manifest.json`, and `styles.css` with plugin ID `bullet-zoom` and version `0.1.1`

#### Scenario: Install the mobile UX correction through BRAT

- **WHEN** BRAT resolves release `0.1.2`
- **THEN** it can download `main.js`, `manifest.json`, and `styles.css` with plugin ID `bullet-zoom` and version `0.1.2`

#### Scenario: Reject a mismatched release tag

- **WHEN** a pushed release tag without its optional leading `v` differs from the version in `manifest.json`
- **THEN** the release workflow fails before publishing or replacing release assets

#### Scenario: Keep the public repository scoped to the plugin

- **WHEN** the standalone repository is generated from the canonical plugin directory
- **THEN** its root contains the plugin project and excludes files outside `000_Agent/tools/obsidian-bullet-zoom/`

<!-- @trace
source: add-obsidian-bullet-zoom-plugin
updated: 2026-08-10
code:
  - 000_Agent/claude-skills/youtube-longform-script/SKILL.md
  - 000_Agent/maps/000_Agent_工具箱地圖.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ingest/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_master.wav
  - 000_Agent/tools/YouTube長片編輯器/burn_long.py
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Big-Idea市場研究Brief.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_raw.wav
  - 000_Agent/tools/obsidian-bullet-zoom/.spectra.yaml
  - 000_Agent/tools/remotion-motion-graphics/src/graphics/G19-Formula.tsx
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_raw.wav
  - 300_專案/_常態內容/日常YouTube_製作管理/關聯圖_專案地圖.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_提案.md
  - 000_Agent/skills/short-form-content-writer/references/single-sentence-openers.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版_預覽.png
  - 000_Agent/claude-skills/spectra-ingest/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/目前決策與待辦.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_預覽.png
  - 000_Agent/maps/SecondBrain_PARA專案地圖.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/00_模型研究與製作說明.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v2.png
  - 000_Agent/skills/short-form-content-writer/references/format-index.md
  - 000_Agent/tools/obsidian-bullet-zoom/versions.json
  - 000_Agent/skills/monthly-review/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28-Big-Idea-Generator執行計畫.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_通用學習網站開發_Prompt.md
  - 000_Agent/memory/daily/2026-07-30.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_V4.0第二份成果版_BigIdea與大綱.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-31_提案.md
  - 000_Agent/skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/每日策展/_策展履歷.md
  - 000_Agent/skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/command-definitions.ts
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版_預覽.png
  - 000_Agent/tools/obsidian-bullet-zoom/src/focus-extension.ts
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_1600x400.png
  - 300_專案/_常態內容/每日策展/2026-08-10_寫作方法.md
  - 000_Agent/tools/obsidian-bullet-zoom/package.json
  - 000_Agent/memory/daily/2026-08-07.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-apply/SKILL.md
  - 000_Agent/codex-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/daily/2026-07-28.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2.png
  - 300_專案/_常態內容/Podcast_騏心動念/關聯圖_專案地圖.md
  - 000_Agent/data/subtitles/GlobalReplaceItems.json
  - 000_Agent/scripts/sync-short-video-repo/sync.sh
  - 000_Agent/skills/paid-article-writer/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線.png
  - 000_Agent/tools/remotion-motion-graphics/scripts/render-all.mjs
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-10_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-03_提案.md
  - 000_Agent/plans/2026-07-28-男性穿搭學習網站.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_20組BigIdea候選.md
  - .agents/skills/spectra-analyze
  - 300_專案/_常態內容/日常YouTube_文章改講稿/策展規劃.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/01_AI十秒寫一千字_寫作還有什麼意義.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-30_提案.md
  - 300_專案/20260803_臺北捷運業務往來地圖/地點核對與繪製規格.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-07_提案.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/04_獨立思考正在被AI掏空嗎.md
  - 000_Agent/claude-skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/編輯會議待辦與決策追蹤.md
  - 000_Agent/codex-skills/spectra-archive/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/README.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查_v3.png
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面橫幅_v2.png
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-17_粗剪清單_真實時間碼對照.md
  - 000_Agent/skills/paid-article-writer/references/asset-criteria.md
  - 300_專案/20260804_伴侶關係自學課程/
  - 000_Agent/scripts/daily-proposals/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_preview-300.png
  - 000_Agent/scripts/transcribe/lint_replace_json.py
  - 300_專案/20260803_臺北捷運業務往來地圖/source/taipei-mrt-base.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_raw.wav
  - 300_專案/_常態內容/每日付費文提案/2026-08-04_善用ChatGPT_Site建立個人線上課程網站_付費文.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-audit/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版調整計畫.md
  - 000_Agent/skills/build-learning-site/SKILL.md
  - .agents/skills/build-learning-site
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/騏心動念_氣泡移至念字右上_3000.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_master.wav
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v4_紅字避讓版.png
  - 000_Agent/plans/2026-07-31-通用學習網站開發Prompt.md
  - 300_專案/_常態內容/Podcast_騏心動念/03_單集腳本/EP01_試播主持稿_每天手寫10個WritingIdeas.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v5_淡彩捷運線_預覽.png
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_preview.mp3
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v3.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_raw.wav
  - 000_Agent/tools/短影音編輯器/new_project.py
  - 000_Agent/claude-skills/spectra-analyze/SKILL.md
  - 000_Agent/codex-skills/spectra-audit/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_preview.mp3
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_一頁式重新提案核心.md
  - 000_Agent/codex-skills/spectra-discuss/SKILL.md
  - 000_Agent/codex-skills/build-learning-site/SKILL.md
  - CLAUDE.md
  - 300_專案/_常態內容/Podcast_騏心動念/01_品牌素材/v9_氣泡移至念字/00_設計說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-propose/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/南區檢查_v2.png
  - 300_專案/_常態內容/每日付費文提案/2026-07-29_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-08-05_提案.md
  - 000_Agent/maps/README.md
  - 000_Agent/codex-skills/spectra-debug/SKILL.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/03_AI時代更該在網路上寫作_5個隱藏紅利.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-commit/SKILL.md
  - 000_Agent/claude-skills/spectra-archive/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/01_靈光起步_preview.mp3
  - 000_Agent/claude-skills/build-learning-site/SKILL.md
  - 300_專案/20260728_個人景點收藏庫/
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-16_剪輯規劃_字卡與Broll.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI_Use_Case_實作驗證表.md
  - 000_Agent/skills/short-form-content-writer/SKILL.md
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.srt
  - 000_Agent/scripts/transcribe/README.md
  - 000_Agent/data/subtitles/README.md
  - 000_Agent/tools/obsidian-bullet-zoom/openspec/config.yaml
  - 000_Agent/tools/obsidian-bullet-zoom/styles.css
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-archive/SKILL.md
  - 000_Agent/memory/daily/2026-07-31.md
  - 000_Agent/skills/proofread-subtitles/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_Top5評選與Top3完整包裝.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v2_預覽.png
  - .spectra.yaml
  - 000_Agent/claude-skills/short-form-content-writer/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-28_V4.1專業養成版_BigIdea與大綱.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-drift/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/02_行銷與銷售/01_電子報與序列信/2026-07-29_課前提醒信3封_Kit草稿.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-debug/SKILL.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-27_7章正文練習修訂規格.md
  - 000_Agent/skills/build-learning-site/agents/openai.yaml
  - 000_Agent/scripts/daily-proposals/proposal_prompt.md
  - 000_Agent/claude-skills/spectra-apply/SKILL.md
  - 000_Agent/memory/MEMORY.md
  - 000_Agent/memory/daily/2026-08-04.md
  - 000_Agent/skills/short-form-content-writer/agents/openai.yaml
  - 000_Agent/skills/build-learning-site/references/delivery-checklist.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI時代付費內容的實作價值_付費文.md
  - 000_Agent/codex-skills/short-form-content-writer/SKILL.md
  - 000_Agent/codex-skills/youtube-longform-script/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_preview.mp3
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/00_製作說明.md
  - 000_Agent/tools/obsidian-bullet-zoom/README.md
  - 000_Agent/codex-skills/long-video-fx/SKILL.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷製作計劃.md
  - 000_Agent/tools/obsidian-bullet-zoom/main.js
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_raw.wav
  - 000_Agent/skills/youtube-longform-script/agents/openai.yaml
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.svg
  - 300_專案/_常態內容/日常YouTube_知識圖卡/2026-06-22_YouTube標題與敘述欄_提案.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27-付費文Asset實用性準則計劃.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/01_念頭浮現_master.wav
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/02_打開筆記_master.wav
  - 000_Agent/scripts/transcribe/transcribe.py
  - 300_專案/20260803_臺北捷運業務往來地圖/output/中央區檢查.png
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_raw.wav
  - 000_Agent/memory/daily/2026-08-03.md
  - 000_Agent/tools/obsidian-bullet-zoom/src/main.ts
  - 300_專案/20260728_男性穿搭學習網站/
  - 000_Agent/skills/youtube-longform-script/references/production-cues.md
  - 000_Agent/codex-skills/spectra-ingest/SKILL.md
  - 000_Agent/plans/2026-08-05-Podcast文章背後的5個問題.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_AI第一版成果落差診斷_Prompt.md
  - 000_Agent/memory/feedback_daily_paid_article_ritual.md
  - 000_Agent/claude-skills/spectra-ask/SKILL.md
  - 000_Agent/claude-skills/spectra-propose/SKILL.md
  - 000_Agent/codex-skills/spectra-drift/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/03_往前半步_master.wav
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_相近主題100本書籍命名研究.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/東區檢查_v2.png
  - 300_專案/_常態內容/日常YouTube_製作管理/Premiere專案模板.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_課前問卷_文字定稿.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/2026-07-28_新版BigIdea與讀者定位草案.md
  - 000_Agent/claude-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/daily/2026-08-10.md
  - 000_Agent/memory/daily/2026-08-08.md
  - 000_Agent/tools/短影音編輯器/README.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_master.wav
  - 000_Agent/skills/proofread-subtitles/scripts/resplit_srt.py
  - 300_專案/_常態內容/Podcast_騏心動念/2026-08-05-Podcast試播專案一頁規劃.md
  - .agents/skills/paid-article-writer
  - 000_Agent/claude-skills/spectra-debug/SKILL.md
  - 000_Agent/tools/YouTube長片編輯器/gen_brand_assets.py
  - 300_專案/_常態內容/日常YouTube_製作管理/影片索引.md
  - 000_Agent/claude-skills/spectra-discuss/SKILL.md
  - 000_Agent/skills/paid-article-writer/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/03_往前一點_master.wav
  - AGENTS.md
  - 300_專案/20260716_一人營運系統V3.1書稿/2026-07-29_V4.2六套系統分組版_BigIdea與大綱.md
  - 000_Agent/claude-skills/spectra-drift/SKILL.md
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_標記圖層.png
  - 000_Agent/claude-skills/long-video-fx/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/AGENTS.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/02_下班後整理_preview.mp3
  - 000_Agent/codex-skills/paid-article-writer/SKILL.md
  - 000_Agent/memory/feedback_paid_article_asset_criteria.md
  - 300_專案/_常態內容/日常YouTube_製作管理/README.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-28_提案.md
  - 000_Agent/claude-skills/spectra-commit/SKILL.md
  - 000_Agent/codex-skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-ask/SKILL.md
  - 000_Agent/tools/obsidian-bullet-zoom/manifest.json
  - 300_專案/_常態內容/日常YouTube_知識圖卡/重點字卡_標示字.ass
  - .agents/skills/spectra-verify
  - 300_專案/20260731_學會閒下來/
  - 300_專案/20260803_臺北捷運業務往來地圖/output/臺北捷運業務往來地圖_完整PNG_v3_紅字版.png
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/05_用AI做摘要式筆記是浪費時間.md
  - 300_專案/20260716_一人營運系統V3.1書稿/封存/README.md
  - 300_專案/20260817_四週ChatGPT日系視覺挑戰營/01_課程教材/課前問卷/2026-07-29_Google表單封面插圖.png
  - 000_Agent/maps/300專案_工作區地圖.md
  - 000_Agent/tools/remotion-motion-graphics/src/Root.tsx
  - 000_Agent/codex-skills/spectra-propose/SKILL.md
  - 000_Agent/skills/short-video-cut/SKILL.md
  - 000_Agent/claude-skills/spectra-verify/SKILL.md
  - 300_專案/_常態內容/Podcast_騏心動念/02_節目音樂/v2_輕快版/drafts/02_打開筆記_首版約140BPM_preview.mp3
  - 000_Agent/tools/obsidian-bullet-zoom/.agents/skills/spectra-discuss/SKILL.md
  - 300_專案/_常態內容/每日付費文提案/_提案履歷.md
  - 300_專案/_常態內容/每日付費文提案/2026-07-27_Gamma_逐字稿轉簡報_Prompt.md
  - 300_專案/20260803_臺北捷運業務往來地圖/source/annotated-reference.png
  - 000_Agent/codex-skills/spectra-commit/SKILL.md
  - 000_Agent/memory/daily/2026-08-09.md
  - 300_專案/_常態內容/每日策展/2026-08-07_復盤.md
  - 300_專案/_常態內容/日常YouTube_文章改講稿/講稿/02_真實經驗在AI時代反而更值錢.md
tests:
  - 000_Agent/tools/obsidian-bullet-zoom/tests/focus-extension.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/command-definitions.test.ts
  - 000_Agent/tools/obsidian-bullet-zoom/tests/mobile-compatibility.test.ts
-->

---
### Requirement: Render the focus root once and append direct children

For version 0.1.25 and later, this requirement SHALL supersede the earlier cloned page-title and first-child insertion behavior. While focus is active, the plugin SHALL present the current focused Bullet as one editable page title below Breadcrumbs on desktop, phone, and tablet. The plugin SHALL promote the real focus-root CodeMirror line rather than render a second copy of its label, SHALL suppress that root line's list-marker chrome, and SHALL keep the line's Markdown positions, editing behavior, selection behavior, Live Preview rendering, and Undo history intact. Direct children and owned continuation content SHALL appear immediately beneath the title, and the editable body SHALL NOT contain a second Bullet row with the same focus-root label.

One plugin-owned add-child footer SHALL appear after the complete focused branch in normal CodeMirror flow. Its visible plus glyph SHALL use the editor text size and faint theme color without a filled square background. On phone and tablet, the button SHALL retain a minimum 44-by-44 CSS-pixel touch target that does not overlap editable content or increase any Bullet row height.

Activating the footer SHALL structurally append one blank unordered-list item as the final direct child of the current focused Bullet. The action SHALL derive the child content column and insertion boundary from complete syntax ownership, SHALL insert after the complete final descendant when children exist or after the parent's owned continuation content when no child exists, SHALL retain the current parent focus anchor, SHALL place a collapsed cursor immediately after the new marker and space, and SHALL apply insertion and selection in one undoable editor transaction. Existing direct children and descendants SHALL retain their order. The action SHALL NOT unfold, refold, or otherwise change any active fold outside the mapped text change.

If the focused target is stale, detached, unsupported, incompletely parsed, or lacks a safe structural append boundary, the plugin SHALL fail closed, preserve Markdown, selection, focus, folds, and Undo history, and display one concise Notice.

#### Scenario: Display one editable page title

- **WHEN** `**Yesterday** felt calmer` is focused on desktop, phone, or tablet
- **THEN** the real focus-root line is presented once as the editable page title, its list-marker chrome is absent, and no second Bullet row repeats that root label

#### Scenario: Show child content immediately beneath the title

- **WHEN** `Question` is focused and owns the direct child `Answer: slept well`
- **THEN** `Answer: slept well` is the first Bullet row beneath the editable `Question` title

##### Example: focused parent and answer

- **GIVEN** source `- Question\n  - Answer: slept well`
- **WHEN** `Question` becomes focused
- **THEN** the focused page visually contains one `Question` title followed by one `Answer: slept well` Bullet row

#### Scenario: Preserve focused root editing

- **WHEN** the user edits the promoted focus-root title line and performs Undo
- **THEN** CodeMirror edits and restores the original Markdown through its normal transaction history without a hidden or cloned title

#### Scenario: Place the compact action after content

- **WHEN** a focused parent owns one or more visible children
- **THEN** the compact add-child footer appears after the complete final descendant and does not occupy space beside the parent or child text

#### Scenario: Append after existing children and descendants

- **WHEN** `Parent` owns `Child A`, a grandchild under `Child A`, and `Child B`, and the user activates the footer
- **THEN** one blank direct child is appended after `Child B`, while the existing child and grandchild order remains unchanged

##### Example: append ordering

- **GIVEN** source `- Parent\n  - Child A\n    - Grandchild\n  - Child B`
- **WHEN** the focused Parent add-child footer runs
- **THEN** source becomes `- Parent\n  - Child A\n    - Grandchild\n  - Child B\n  - ` in one transaction

#### Scenario: Append after parent continuation content

- **WHEN** a focused parent has owned continuation content and no direct child
- **THEN** the blank direct child is inserted after that continuation content without splitting or rewriting it

#### Scenario: Preserve a small mobile glyph and safe touch target

- **WHEN** the footer appears on a phone or tablet
- **THEN** its visible plus is no larger than the editor text while its isolated touch target is at least 44 by 44 CSS pixels and overlaps no editable row

#### Scenario: Undo child creation once

- **WHEN** the user activates the footer and then performs one Undo
- **THEN** the appended child disappears, the original Markdown is restored, and no second Undo is required for cursor placement

#### Scenario: Preserve fold ownership during append

- **WHEN** unrelated descendant or sibling folds are active and the user activates the footer
- **THEN** insertion maps through the document while those folds retain their existing ownership and state

#### Scenario: Fail closed for an unsafe target

- **WHEN** the focused marker becomes stale or complete syntax ownership is unavailable before the footer is activated
- **THEN** no transaction mutates the document or selection, focus and folds remain unchanged, and one concise Notice explains that the child cannot be created

---
### Requirement: Exact Bullet marker activation owns Zoom before native disclosure fallback

For version 0.1.26 and later, this requirement SHALL supersede the earlier nested-collapse-indicator pass-through clauses and scenario in `Enter focus through marker or command`. An activation whose live DOM resolves to the exact canonical `.bullet-zoom-marker` for one supported Bullet SHALL enter or refocus Bullet Zoom in one action, including when Obsidian collapse-indicator DOM is nested inside that exact marker. The plugin SHALL prevent the successful exact-marker event from invoking native fold or unfold. An activation originating from a separate `.collapse-indicator` outside the exact canonical marker SHALL remain unprevented and owned by Obsidian. Unsupported, foreign, detached, ambiguous, or stale marker DOM SHALL remain non-actionable.

#### Scenario: Zoom through a foldable desktop Bullet circle

- **WHEN** a desktop supported Bullet has a native fold disclosure and the user clicks collapse-indicator DOM nested inside its exact decorated Bullet marker
- **THEN** that Bullet enters Zoom in one click, its target-owned fold is removed by the shared focus transition when active, and the native fold handler does not run

#### Scenario: Preserve a separate native disclosure

- **WHEN** a desktop, phone, or tablet user activates a collapse indicator outside the exact decorated Bullet marker
- **THEN** Bullet Zoom leaves the event unprevented for Obsidian fold or unfold and preserves the existing focus session and selection

#### Scenario: Reject a foreign nested marker

- **WHEN** another extension creates DOM with marker and collapse-indicator classes that does not resolve to one canonical supported Bullet in the owning editor row
- **THEN** Bullet Zoom does not navigate and does not prevent the event

---
### Requirement: Focused-page child insertion follows the editor indentation unit

For version 0.1.26 and later, the focused-page add action SHALL append the blank unordered-list marker at the greater of the focused target's marker indentation plus one configured CodeMirror indentation unit and the target's syntax-required content column. The plugin SHALL generate the indentation with the editor's indentation-string semantics so tab-based and space-based settings match Obsidian Outliner while wide marker spacing remains structurally valid. The inserted item SHALL be a syntax-owned direct child of the focused Bullet, SHALL appear at the same visual indentation as an Outliner-indented child under the same editor settings, and SHALL retain the existing final-child ordering, cursor placement, focus anchor, fold mapping, and one-step Undo contract.

#### Scenario: Append with a four-space editor indentation unit

- **GIVEN** a focused root source item `- Fundraising video` and an editor indentation unit of four spaces
- **WHEN** the user activates the focused-page add button
- **THEN** the source becomes `- Fundraising video\n    - `, the new item is a direct child, and the cursor is placed after its marker and space

#### Scenario: Append with a tab editor indentation unit

- **GIVEN** a focused item whose marker starts at column four and an editor indentation unit represented by one tab of width four
- **WHEN** the user activates the focused-page add button
- **THEN** the new marker starts one tab stop deeper than the focused marker using the editor-generated indentation string and remains a direct child in the syntax tree

#### Scenario: Preserve existing descendants and one-step Undo

- **WHEN** a focused item already owns children or continuation content and the user activates the add button
- **THEN** one configured-indent direct child is appended after the complete owned branch in the existing order, current focus and folds are retained, and one Undo removes both the inserted row and cursor move

---
### Requirement: Claim the exact Bullet marker before native pointer handling

For version 0.1.27 and later, this requirement SHALL supersede the earlier nested-collapse-indicator pass-through clauses for the exact visible Bullet marker. When a user presses or clicks the exact plugin-owned `.bullet-zoom-marker` for one supported Bullet, Bullet Zoom SHALL claim the gesture before Obsidian's native Fold/Unfold handler, prevent that native gesture, and enter or refocus the target in one Zoom action. A separate `.collapse-indicator` outside the exact canonical marker SHALL remain unprevented and SHALL retain native Fold/Unfold ownership. The early gesture claim SHALL be scoped to the owning EditorView and SHALL be consumed at most once by the follow-up click.

#### Scenario: Zoom a foldable Bullet dot before native Fold

- **WHEN** a desktop user presses and clicks the exact visible marker for a supported foldable Bullet and a native collapse listener is attached to the same row
- **THEN** the native listener does not fold the row, the target enters Zoom once, and the cursor moves to the end of the target's first line

#### Scenario: Consume an early marker gesture only once

- **WHEN** the early pointer event for an exact marker is followed by its click event
- **THEN** Bullet Zoom performs one focus transition and does not interpret the follow-up click as an exit or second transition

#### Scenario: Preserve a separate native disclosure

- **WHEN** a user presses or clicks a `.collapse-indicator` that is outside the exact plugin-owned marker
- **THEN** Bullet Zoom leaves the event unprevented and Obsidian retains Fold/Unfold ownership

#### Scenario: Reject stale or foreign marker-like DOM

- **WHEN** a detached, foreign, ambiguous, or stale element carries marker-like classes
- **THEN** Bullet Zoom performs no navigation, does not prevent the event, and does not mutate Markdown or selection

---
### Requirement: Render focused descendants in a local indentation coordinate system

For version 0.1.27 and later, when Bullet Zoom promotes a focused source line into the page title, every visible descendant line SHALL render with its leading source indentation reduced by at most the focused root's leading indentation columns. The resulting visual indentation SHALL preserve the relative distance between the focused root, its direct children, and deeper descendants. This normalization SHALL be presentation-only: source Markdown, syntax ownership, absolute Outliner indentation, fold ranges, focus anchors, cursor positions, selection behavior, and one-step Undo SHALL remain unchanged.

#### Scenario: Keep a deeply indented focused child editable

- **GIVEN** a source Bullet whose marker starts at indentation column 12 and a newly inserted direct child one configured indentation unit deeper
- **WHEN** the parent is focused
- **THEN** the focused title appears at the page origin and the child appears one relative child indentation below it, without a large blank prefix before the child Bullet

#### Scenario: Preserve absolute Markdown while normalizing the page

- **WHEN** a user focuses an indented Bullet and edits the promoted title or its newly added child
- **THEN** the document retains its original absolute indentation and the focused page continues to show the child relative to the title

#### Scenario: Preserve folds, focus, selection, and Undo

- **WHEN** a focused branch contains descendant folds and the user appends a child, edits it, and performs one Undo
- **THEN** existing folds and the focus anchor remain valid, the cursor and selection remain editor-owned, and one Undo restores the exact pre-append Markdown

#### Scenario: Fail closed for unsupported rendering state

- **WHEN** focus is stale, the target is detached or unsupported, or the document cannot provide a safe focused branch
- **THEN** the plugin keeps the existing fail-closed behavior and does not rewrite source solely to repair visual indentation

---
### Requirement: Rebase focus page layout to the focused bullet

When a Bullet is focused, the plugin SHALL lay out the focus page relative to the focused bullet instead of the document's absolute list depth. The focus root line SHALL render with zero text-indent and zero inline-start padding so the title and its wrapped lines use the full editor width. Every bullet line inside the focused branch SHALL hide its leading indentation characters and SHALL receive a relative-depth custom property (capped at 8) that drives a rebased hanging indent, so a direct child renders at depth one regardless of how deep the branch sits in the document. Exiting focus SHALL restore the native layout.

#### Scenario: Zoom into a third-level bullet

- **WHEN** the user focuses a Bullet nested three levels deep
- **THEN** the focus root line carries the focus-root class with zeroed indent overrides, and its direct children carry the rebased line class with relative depth `1`

##### Example: Deep branch rebases

- **GIVEN** the document is `- A\n  - B\n    - C 這是一段會折行的長文字\n      - D\n        - E`
- **WHEN** the user focuses `C`
- **THEN** the line of `D` carries the rebased class with relative depth `1`, the line of `E` carries relative depth `2`, and the leading indentation characters of both lines are hidden from rendering

#### Scenario: Wrapped title uses the full width

- **WHEN** a focused bullet's label is longer than one visual line
- **THEN** the focus root line's computed text-indent is `0` and its inline-start padding is `0`, so wrapped title lines start at the editor's left edge

##### Example: Root line CSS contract

- **GIVEN** the plugin stylesheet is loaded and a line carries the focus-root class
- **WHEN** its computed style is inspected
- **THEN** text-indent is `0px` and padding-inline-start is `0px`

#### Scenario: Leaving focus restores native indentation

- **WHEN** the user exits focus
- **THEN** no line carries the rebased class or the focus-root class and the native indentation renders unchanged

##### Example: Exit cleanup

- **GIVEN** a focused branch whose lines carry rebased classes
- **WHEN** the focus session ends
- **THEN** querying the editor DOM for the rebased line class returns no elements

---
### Requirement: Provide size sliders for the focus title and the outline

The plugin SHALL provide a settings tab with two sliders — focus title scale and outline scale — each an integer percentage from 60 to 160 with step 5 and default 100, persisted via plugin data. Changing a slider SHALL apply immediately by writing the corresponding scale multipliers to custom properties `--bullet-zoom-title-scale` and `--bullet-zoom-outline-scale` on the document body, which the stylesheet multiplies into the focus root title font-size (desktop and phone variants) and the outline sidebar font-size. Loading settings SHALL normalize invalid values: non-numeric input falls back to the default and out-of-range numbers clamp to the range. Unloading the plugin SHALL remove both custom properties.

#### Scenario: Adjust the title slider

- **WHEN** the user drags the focus title slider to 130
- **THEN** the plugin saves `titleScale` 130 and sets `--bullet-zoom-title-scale` to `1.3` on the document body

##### Example: Slider write-through

- **GIVEN** the settings tab is open with default values
- **WHEN** the title slider changes to `130`
- **THEN** the body style contains `--bullet-zoom-title-scale: 1.3` and the persisted data records `titleScale: 130`

#### Scenario: Normalize invalid persisted data

- **WHEN** the plugin loads persisted data containing a non-numeric or out-of-range scale
- **THEN** non-numeric values fall back to 100 and out-of-range numbers clamp into 60–160

##### Example: Normalization table

- **GIVEN** persisted data `{ "titleScale": "abc", "outlineScale": 300 }`
- **WHEN** settings are loaded
- **THEN** the effective values are `titleScale` 100 and `outlineScale` 160

#### Scenario: Stylesheet multiplies the scales

- **WHEN** the plugin stylesheet renders the focus root title and the outline sidebar
- **THEN** their font-size declarations multiply the base size by the corresponding scale custom property with a fallback of 1

##### Example: CSS contract

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** its rules are inspected
- **THEN** the focus root title and phone title font-size values reference `--bullet-zoom-title-scale` and the outline sidebar font-size references `--bullet-zoom-outline-scale`

#### Scenario: Unload removes the overrides

- **WHEN** the plugin unloads
- **THEN** neither `--bullet-zoom-title-scale` nor `--bullet-zoom-outline-scale` remains on the document body

##### Example: Cleanup audit

- **GIVEN** a loaded plugin with both custom properties applied
- **WHEN** onunload runs
- **THEN** reading either property from the body style returns an empty string

---
### Requirement: Reset each size slider to its default with one tap

Each size slider setting SHALL include a reset extra button that, when activated, sets the corresponding scale back to 100, persists the change, reapplies the scale custom properties, and updates the slider control in place to show 100 without re-rendering the settings tab.

#### Scenario: Reset the title slider

- **WHEN** the user taps the reset button next to the focus title slider
- **THEN** the persisted title scale becomes 100, the body custom property becomes `1`, and the slider shows 100 without the page moving

##### Example: Reset after adjustment

- **GIVEN** the title scale is 130
- **WHEN** the reset button is activated
- **THEN** the stored title scale is 100 and the slider displays 100

---
### Requirement: Show the full breadcrumb trail on mobile

The mobile breadcrumb panel SHALL display the note crumb, every ancestor crumb, and the current crumb with visible separators, each crumb showing its full label without a per-crumb max-width truncation, and SHALL allow horizontal scrolling when the trail exceeds the viewport width. The current crumb keeps its flexible shrink behavior at the end of the trail.

#### Scenario: Deep focus shows every level in full

- **WHEN** the user focuses a Bullet nested three levels deep on mobile
- **THEN** the breadcrumb panel renders the note crumb, all ancestor crumbs with their full labels, separators between crumbs, and the current crumb

##### Example: No per-crumb truncation

- **GIVEN** a mobile breadcrumb panel for a focus three levels deep
- **WHEN** the ancestor crumb styles are inspected
- **THEN** no ancestor crumb carries a 6.5em max-width and their labels are not ellipsized by the plugin stylesheet

#### Scenario: Long trails scroll horizontally

- **WHEN** the full trail is wider than the panel
- **THEN** the panel scrolls horizontally instead of dropping or truncating levels

##### Example: Panel overflow contract

- **GIVEN** the mobile stylesheet is loaded
- **WHEN** the breadcrumb panel rule is inspected
- **THEN** its horizontal overflow is auto

---
### Requirement: Configure marker detection for bullets and numbered items

The plugin SHALL support Zoom on ordered-list items whose markers are a number followed by `.` or `)`, in addition to plain `-` bullets, gated by a marker-detection configuration with two booleans: bullets and numbered. The library-level default SHALL be bullets enabled and numbered disabled (identical to prior behavior), while the plugin SHALL inject user settings that default both to enabled, expose two toggles in the settings tab, persist them, and rebuild the editor extensions immediately on change. When numbered detection is disabled, items inside ordered lists SHALL remain excluded as before; when enabled, an ordered item resolves through its nearest ordered-list ancestor and participates in Zoom, breadcrumbs, and the outline.

#### Scenario: Zoom a numbered item

- **WHEN** numbered detection is enabled and the user activates the marker of `2. Second`
- **THEN** the item becomes the focus anchor like a plain bullet would

##### Example: Ordered marker resolution

- **GIVEN** the document `1. First\n2. Second` with numbered detection enabled
- **WHEN** the supported-bullet resolver runs at the second line
- **THEN** it returns a marker spanning `2.` and the label `Second`

#### Scenario: Toggles gate each marker kind

- **WHEN** the bullets toggle is off and the numbered toggle is on
- **THEN** `- A` resolves to no supported item while `1. B` resolves normally

##### Example: Bullets disabled

- **GIVEN** the document `- A\n1. B` with bullets disabled and numbered enabled
- **WHEN** the resolver runs on both lines
- **THEN** line one yields null and line two yields a supported item

#### Scenario: Disabled numbered detection preserves the ordered exclusion

- **WHEN** numbered detection is disabled
- **THEN** ordered items and bullets nested under ordered lists resolve to null exactly as in prior releases

##### Example: Legacy exclusion

- **GIVEN** the document `1. First\n   - Nested` with numbered detection disabled
- **WHEN** the resolver runs on both lines
- **THEN** both lines yield null

#### Scenario: Settings persist and apply immediately

- **WHEN** the user flips either toggle in the settings tab
- **THEN** the persisted data updates and the editor extensions rebuild so detection changes without reloading the plugin

##### Example: Persisted toggle values

- **GIVEN** default settings
- **WHEN** the numbered toggle is turned off
- **THEN** the persisted data records `zoomNumbered: false` and `zoomBullets: true`

---
### Requirement: Extract a bullet branch into a new note

The plugin SHALL provide an editor command that is available only when the cursor sits on a supported bullet, opens a modal asking for a file name, and on confirmation creates a Markdown file with that name in the current note's folder, moves the bullet's branch content into it, and replaces the branch in the source note with a wiki-link bullet at the original indent so the list structure and outline stay valid. A removeTopBullet setting (default enabled, exposed as a settings toggle) SHALL control the new file's content: when enabled the top bullet line is dropped and its child lines are dedented to the top level by their minimal common indent prefix (falling back to the bullet's label text when there are no children); when disabled the whole branch is included rebased to zero indent. An empty file name or an existing file SHALL abort with a notice and leave the source note unchanged.

#### Scenario: Extract with the default remove-top behavior

- **WHEN** the user runs the command on a bullet with children, enters a name, and confirms
- **THEN** the new file contains the dedented children, and the source branch becomes a link bullet at the original indent

##### Example: Remove-top extraction

- **GIVEN** the source `- Topic\n  - P1\n    - P1a\n  - P2` with the cursor on `Topic` and the name `新筆記`
- **THEN** the new file content is `- P1\n  - P1a\n- P2` and the source becomes `- [[新筆記]]`

#### Scenario: Extract keeping the top bullet

- **WHEN** removeTopBullet is disabled and the user extracts a nested bullet
- **THEN** the new file contains the whole branch rebased to zero indent

##### Example: Keep-top extraction

- **GIVEN** the source `- A\n  - Topic\n    - P1` with the cursor on `Topic`, removeTopBullet disabled, and the name `T`
- **THEN** the new file content is `- Topic\n  - P1` and the source becomes `- A\n  - [[T]]`

#### Scenario: A leaf bullet extracts its label

- **WHEN** removeTopBullet is enabled and the bullet has no children
- **THEN** the new file contains the bullet's label text

##### Example: Leaf extraction

- **GIVEN** the source `- Only text` and the name `N`
- **THEN** the new file content is `Only text` and the source becomes `- [[N]]`

#### Scenario: Invalid names abort safely

- **WHEN** the entered name is empty or a file with that name already exists
- **THEN** a notice is shown and the source note is unchanged

---
### Requirement: Configure the extract destination and prefill the name

The extract command SHALL support an extractFolder setting (default empty, meaning the current note's folder) that determines where the new note is created, creating the folder when it does not exist and aborting with a notice when creation fails. The extract modal SHALL prefill its name field with the bullet's text, sanitized by trimming whitespace, unwrapping Markdown link syntax to its display text, and removing characters that are illegal in file names, and SHALL select that text so the user can overwrite it directly.

#### Scenario: Extract into a configured folder

- **WHEN** the extract folder setting is a non-empty path and the user confirms a name
- **THEN** the new note is created under that folder rather than the current note's folder

##### Example: Configured destination

- **GIVEN** the extract folder setting is `Cards` and the entered name is `新筆記`
- **THEN** the created path is `Cards/新筆記.md`

#### Scenario: Empty setting keeps the current folder

- **WHEN** the extract folder setting is empty
- **THEN** the new note is created in the current note's folder as before

#### Scenario: Prefilled and sanitized name

- **WHEN** the extract modal opens for a bullet
- **THEN** the name field contains the bullet text with illegal file-name characters removed and link syntax unwrapped, and the text is selected

##### Example: Sanitization table

- **GIVEN** the bullet text `關於 [[卡片盒]] / 筆記: 方法`
- **WHEN** the modal opens
- **THEN** the prefilled name is `關於 卡片盒 筆記 方法`

---
### Requirement: Autocomplete the extract destination folder

The extract destination setting SHALL offer autocomplete over the vault's existing folders. The plugin SHALL collect folder paths excluding the vault root, deduplicated and sorted lexicographically, and SHALL filter them case-insensitively by substring with prefix matches ordered first, returning at most a bounded number of suggestions (default 8) and returning the leading suggestions when the query is empty. Selecting a suggestion by click or Enter SHALL fill the field with that path and persist the setting; ArrowDown and ArrowUp SHALL move the highlighted suggestion and Escape SHALL dismiss the list. Typing a folder that does not exist SHALL remain allowed.

#### Scenario: Filter folders while typing

- **WHEN** the user types part of a folder name into the destination field
- **THEN** the suggestion list shows matching existing folders with prefix matches first

##### Example: Prefix ordering

- **GIVEN** the vault folders `Cards`, `Archive/Cards`, `Notes`
- **WHEN** the query is `car`
- **THEN** the suggestions are `Cards` then `Archive/Cards`

#### Scenario: Select a suggestion

- **WHEN** the user clicks a suggestion or presses Enter on the highlighted one
- **THEN** the field value becomes that path, the setting persists, and the list closes

##### Example: Click fills the field

- **GIVEN** the suggestion `Cards/Inbox` is displayed
- **WHEN** it is clicked
- **THEN** the field value is `Cards/Inbox` and the persisted extract folder is `Cards/Inbox`

#### Scenario: Empty query lists leading folders

- **WHEN** the field is focused while empty
- **THEN** the first suggestions in sorted order are shown, bounded by the suggestion limit

##### Example: Bounded list

- **GIVEN** a vault with twenty folders
- **WHEN** the empty field is focused
- **THEN** at most eight suggestions render

---
### Requirement: Apply a template when extracting a note

The extract command SHALL support an extractTemplatePath setting (default empty, meaning no template) selectable through a Markdown-file autocomplete in the settings tab. When set and the file exists, the plugin SHALL read the template and render the new note by substituting the placeholders `{{content}}`, `{{title}}`, `{{date}}`, `{{time}}`, and `{{source}}`, matched case-insensitively and tolerating inner whitespace, where content is the extracted branch text, title is the entered file name, date is the local `YYYY-MM-DD`, time is the local `HH:mm`, and source is a wiki link to the originating note or an empty string when unavailable. A template without a content placeholder SHALL have the extracted content appended after a blank line, unknown placeholders SHALL be left untouched, an empty template SHALL yield the extracted content unchanged, and a template that cannot be read SHALL abort the extraction with a notice leaving the source note unchanged.

#### Scenario: Render a template with placeholders

- **WHEN** a template containing placeholders is configured and the user extracts a bullet
- **THEN** the new note contains the template with each known placeholder replaced

##### Example: Standard template

- **GIVEN** the template `# {{title}}\n\n{{content}}\n\n來源：{{source}}`, the name `想法`, the content `- A`, and the source note `Daily`
- **THEN** the new note is `# 想法\n\n- A\n\n來源：[[Daily]]`

#### Scenario: Template without a content placeholder

- **WHEN** the configured template has no content placeholder
- **THEN** the extracted content is appended after a blank line

##### Example: Header-only template

- **GIVEN** the template `# {{title}}` , the name `想法`, and the content `- A`
- **THEN** the new note is `# 想法\n\n- A`

#### Scenario: No template configured

- **WHEN** the template setting is empty
- **THEN** the new note contains exactly the extracted content as before

##### Example: Unchanged behavior

- **GIVEN** an empty template and the content `- A`
- **THEN** the new note is `- A`

#### Scenario: Unreadable template aborts safely

- **WHEN** the configured template file cannot be read
- **THEN** a notice is shown, no file is created, and the source note is unchanged

---
### Requirement: Present an English interface grouped into settings sections

All user-facing strings SHALL be written in plain English, and the settings tab SHALL group its options under six headings in this order: `Zoom`, `Focus page`, `Outline`, `Bullet commands`, `Bullet menu`, and `Extract to new note`. Each heading SHALL carry a one-sentence description of what the section covers, and every option SHALL appear under the heading matching its purpose, with names as short noun phrases, descriptions as complete sentences, buttons labelled with verbs, and notices stating what happened plus what to do next. Every setting the plugin persists SHALL have a control in the tab, including the bullet copy scope and the prefix text. Setting keys, defaults, and behavior SHALL stay unchanged.

#### Scenario: Settings render in grouped sections

- **WHEN** the settings tab opens
- **THEN** six described section headings render in order and every option appears under its matching heading

##### Example: Extract options grouped together

- **GIVEN** the settings tab is open
- **WHEN** the `Extract to new note` section is inspected
- **THEN** it contains the destination folder, template file, and remove-top-bullet options

##### Example: Bullet command options grouped together

- **GIVEN** the settings tab is open
- **WHEN** the `Bullet commands` section is inspected
- **THEN** it contains the copy scope and the prefix text

#### Scenario: Interface strings are English

- **WHEN** commands, notices, panels, or dialogs display text
- **THEN** the text is English

##### Example: Command names

- **GIVEN** the plugin registers its commands
- **WHEN** their names are inspected
- **THEN** they read `Exit bullet focus` and `Go to parent bullet`

#### Scenario: Empty labels use English fallbacks

- **WHEN** a bullet has no text or a note has no title
- **THEN** the interface shows `Untitled bullet` or `Untitled note`

##### Example: Empty bullet label

- **GIVEN** a focused bullet whose text is empty
- **WHEN** the breadcrumb renders
- **THEN** it displays `Untitled bullet`

---
### Requirement: Choose what replaces the extracted bullet

The extract command SHALL support an extractReplacement setting with the values `link`, `embed`, and `none`, defaulting to `link` and normalizing unknown or missing values to `link`, exposed as a dropdown in the settings tab. After a successful extraction the source note SHALL keep a link bullet for `link`, an embed bullet for `embed` — both preserving the original indentation — or no remaining content for `none`. When removing content the plugin SHALL also remove the branch's line break, consuming the following newline when one exists, the preceding newline when the branch ends the document, and neither when the branch is the whole document, so no blank line is left behind and the outline keeps rendering.

#### Scenario: Keep a link by default

- **WHEN** the replacement setting is `link` and an extraction succeeds
- **THEN** the branch is replaced with a link bullet at the original indent

##### Example: Link replacement

- **GIVEN** the source `- A\n  - Topic\n    - P1` extracted at `Topic` with the name `T`
- **THEN** the source becomes `- A\n  - [[T]]`

#### Scenario: Keep an embed

- **WHEN** the replacement setting is `embed`
- **THEN** the branch is replaced with an embed bullet at the original indent

##### Example: Embed replacement

- **GIVEN** the source `- A\n  - Topic\n    - P1` extracted at `Topic` with the name `T`
- **THEN** the source becomes `- A\n  - ![[T]]`

#### Scenario: Leave nothing behind

- **WHEN** the replacement setting is `none`
- **THEN** the branch and its line break are removed without leaving a blank line

##### Example: Removal in the middle

- **GIVEN** the source `- A\n- Topic\n  - P1\n- B` extracted at `Topic`
- **THEN** the source becomes `- A\n- B`

##### Example: Removal at the end

- **GIVEN** the source `- A\n- Topic\n  - P1` extracted at `Topic`
- **THEN** the source becomes `- A`

---
### Requirement: Choose what happens after extracting

The extract command SHALL support an extractOpenBehavior setting with the values `stay`, `current`, `tab`, and `split`, defaulting to `stay` and normalizing unknown or missing values to `stay`, exposed as a dropdown in the settings tab. After the new note is created and the source note is updated, the plugin SHALL keep the current view for `stay`, open the new note in the active tab for `current`, in a new tab for `tab`, and in a split for `split`. A failure while opening SHALL show a notice without undoing the completed extraction.

#### Scenario: Stay in the source note by default

- **WHEN** the behavior setting is `stay` and an extraction succeeds
- **THEN** no leaf is opened and the user keeps editing the source note

#### Scenario: Open the new note

- **WHEN** the behavior setting is `current`, `tab`, or `split`
- **THEN** the created file opens in the active tab, a new tab, or a split respectively

##### Example: New tab behavior

- **GIVEN** the behavior setting is `tab` and the extraction created `Cards/T.md`
- **THEN** the plugin opens that file in a new tab after the source note is updated

#### Scenario: Opening failures do not undo the extraction

- **WHEN** opening the created file throws
- **THEN** a notice reports that the note could not be opened and both the new file and the updated source note remain

---
### Requirement: Draw indent guides on the focus page

The plugin SHALL support a focusIndentGuides setting, default enabled and exposed as a toggle in the settings tab, that adds a body-level class enabling vertical indent guides on focus-page bullet lines. Guides SHALL be drawn as a repeating background gradient whose period equals the indent unit and whose painted width equals the line's relative depth multiplied by that unit, so a line at depth N shows N ancestor guides aligned with the ancestor bullet markers, using the theme border color at one pixel wide without changing layout metrics or hit areas. Every guide rule SHALL be scoped under the body class, and disabling the setting or the plugin SHALL remove the guides entirely.

#### Scenario: Guides appear for nested lines

- **WHEN** the setting is enabled and the focus page renders a nested branch
- **THEN** each rebased line paints one vertical guide per ancestor level

##### Example: Depth two line

- **GIVEN** the guides class is present and a line carries relative depth `2`
- **WHEN** its computed background is inspected
- **THEN** the background image is a repeating gradient whose painted width resolves from the depth and indent unit

#### Scenario: Disabling removes the guides

- **WHEN** the setting is turned off
- **THEN** the body no longer carries the guides class and no guide rule applies

##### Example: Class removal

- **GIVEN** the guides setting is enabled and the class is on the document body
- **WHEN** the setting is turned off
- **THEN** the document body no longer has the guides class

#### Scenario: Guide styles stay scoped

- **WHEN** the plugin stylesheet is inspected
- **THEN** every rule painting a guide background includes the guides body class in its selector

##### Example: Selector audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** rules whose background image is a repeating gradient are collected
- **THEN** each of their selectors contains `bullet-zoom-indent-guides`

---
### Requirement: Keep stray lines visible and repair them automatically

While a focus session is active the plugin SHALL keep the focused area visible without hiding content that arrives at its end, remembering the session's visible end and never shrinking it while the session lasts, mapping that end through every document change, and adding no marker, highlight, or notice. When the autoFixStrayLines setting is enabled, default on and exposed as a toggle, the plugin SHALL — after document changes settle for about 600 milliseconds, only while a focus session is active, and only in the editor pane that currently holds input focus — repair the lines between the focused bullet and the remembered visible end using only regular-expression and indentation-column classification, never the syntax tree. A pane without input focus SHALL never be repaired, and losing focus SHALL cancel a scheduled repair, so document changes that reach a background pane from synchronisation, from the same note being open twice, or from another plugin never rewrite a note the user is not editing. Lines already indented deeper than the focused bullet and carrying a list marker SHALL be left untouched. Every other non-blank line SHALL be indented one level below the nearest preceding list item, or below the focused bullet when there is none, with all lines of the same repaired run sharing that one indentation so they stay siblings; lines that already carry a list marker SHALL keep their marker and text while every other line SHALL keep its text verbatim and gain a `- ` marker. Blank lines between repaired lines SHALL be removed. Repair SHALL stop at a code fence or a heading, leaving that line and everything after it untouched, and the replaced range SHALL end at the last line the repair actually rewrote, so blank lines before a boundary survive. A list item that carries no indentation and whose content is a heading SHALL be restored to a plain heading by dropping its list marker, and the repair SHALL stop at that line; an indented list item whose content is a heading SHALL be left exactly as it is, and the repair SHALL stop there too. Repair SHALL be dispatched as its own history step, and SHALL dispatch nothing when no line needs changing. When no focus session is active the plugin SHALL NOT modify the document.

#### Scenario: Dictated lines nest under the preceding bullet

- **WHEN** plain lines follow an existing child bullet inside the focused area
- **THEN** they become bullets one level below that child bullet and remain siblings of each other

##### Example: Continuing the last bullet

- **GIVEN** the document `- Topic\n  - A\n\nfirst idea\n\nsecond idea` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - A\n    - first idea\n    - second idea`

#### Scenario: A background pane is never repaired

- **WHEN** a pane holding a focus session loses input focus and its document changes anyway
- **THEN** no repair runs in that pane

##### Example: Editing another pane

- **GIVEN** a focused bullet in a pane that no longer holds input focus, and auto-fix enabled
- **WHEN** that pane's document gains `\n\ndictated text` and the debounce elapses
- **THEN** the document still reads as it did, with the dictated text untouched

#### Scenario: Headings survive the repair

- **WHEN** a heading separates groups of bullets inside the repaired region
- **THEN** the heading keeps its `#` marker, the repair stops there, and the blank line before it is left in place

##### Example: A heading between groups

- **GIVEN** the document `- Topic\nstray line\n\n# Outline\n- Later` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n  - stray line\n\n# Outline\n- Later`

#### Scenario: A heading swallowed by a list marker is restored

- **WHEN** a top-level list item's content is a heading
- **THEN** the list marker is dropped so the heading works again, and the repair stops at that line

##### Example: Restoring a swallowed heading

- **GIVEN** the document `- Topic\n- # Outline\nstray` focused on `Topic` with the visible end at the document end
- **WHEN** the repair plan is applied
- **THEN** the document becomes `- Topic\n# Outline\nstray`

#### Scenario: No focus session means no changes

- **WHEN** the user edits a list while no focus session is active
- **THEN** the plugin dispatches no repair transaction at all

##### Example: Editing outside zoom

- **GIVEN** the document `- A` with no focus session and auto-fix enabled
- **WHEN** `\n\ndictated text` is appended and the debounce elapses
- **THEN** the document still reads `- A\n\ndictated text`

---
### Requirement: Run bullet commands from a radial menu

The plugin SHALL register bullet commands for copying, deleting, and prefixing the bullet at the cursor, and SHALL offer a press-and-hold menu that runs any Obsidian command against a chosen bullet. Copy SHALL place the bullet's text or its whole branch on the clipboard according to the copy scope setting; delete SHALL remove the bullet's branch together with its line break; prefix SHALL insert the configured text after the marker, or remove it when already present. Each command SHALL do nothing and report why when the cursor is not on a supported bullet.

The menu SHALL be available on mobile only, gated by an enable setting defaulting to on, with a configurable press duration between 250 and 1000 milliseconds defaulting to 450, and eight slots each holding an optional Obsidian command id, an optional icon id, and an enabled flag, defaulting to copy, delete, prefix, zoom, and extract enabled in the first five slots. Persisted slots stored as plain command ids, or as records without an icon field, SHALL be read as enabled slots with no icon override so earlier configurations keep working. Opening the menu SHALL place the editor cursor on the target bullet first, so any command that acts on the cursor works. Slots that are disabled or hold no command id SHALL not render, and disabling a slot SHALL keep its command id and icon so re-enabling restores it.

The menu SHALL lay its items out as a fan that opens toward the side of the viewport with more room — to the right when the press is in the left half, to the left otherwise — spanning a vertical range clamped so every item stays inside the viewport. The fan radius SHALL be at least the radius needed to keep adjacent item centres one button apart, so a full set of slots never overlaps. Items SHALL be drawn as icons supplied by the caller rather than as command names, and the menu SHALL display the name of the currently highlighted item near its centre so an icon is never ambiguous. Each item's icon SHALL come from the slot's configured icon id when it has one, from the command's own icon otherwise, and from a default marker icon when neither exists. Pointer position SHALL be matched to the nearest item centre within a hit radius rather than by angle, so the layout and the hit test never disagree; a pointer inside the centre dead zone SHALL mean cancel. Choosing an item SHALL run its command; releasing over the centre, tapping outside, or pressing Escape SHALL close the menu without running anything.

#### Scenario: Copy, delete, and prefix act on the cursor's bullet

- **WHEN** each bullet command runs with the cursor on a supported bullet
- **THEN** copy fills the clipboard, delete removes the branch, and prefix toggles the configured text

##### Example: Delete removes the branch

- **GIVEN** the document `- A\n- Topic\n  - P1\n- B` with the cursor on `Topic`
- **WHEN** the delete command runs
- **THEN** the document becomes `- A\n- B`

#### Scenario: Commands refuse a non-bullet cursor

- **WHEN** a bullet command runs while the cursor sits on a plain paragraph
- **THEN** the document is unchanged and a notice explains what to do

#### Scenario: Slots map to commands

- **WHEN** the menu renders with its configured slots
- **THEN** only slots holding a command id produce an item, in slot order

##### Example: Sparse configuration

- **GIVEN** slots holding enabled `copy`, an empty value, and enabled `delete`
- **WHEN** the items are computed
- **THEN** two items render, for `copy` and `delete`

#### Scenario: Disabled slots stay configured but hidden

- **WHEN** a slot holding a command is disabled
- **THEN** it renders no item while keeping its command id for later

##### Example: Toggling a slot off

- **GIVEN** slots holding enabled `copy` and disabled `delete`
- **WHEN** the items are computed
- **THEN** only `copy` renders, and the stored `delete` id is unchanged

#### Scenario: A slot carries its own icon

- **WHEN** a slot holds an icon id
- **THEN** the computed item exposes that icon id, and an empty icon id leaves the item without an override

##### Example: Icon override travels with the item

- **GIVEN** slots holding enabled `copy` with icon `star` and enabled `delete` with no icon
- **WHEN** the items are computed
- **THEN** the first item's icon is `star` and the second item's icon is empty

#### Scenario: The fan opens away from the nearest edge

- **WHEN** the press is in the left half of the viewport
- **THEN** every item is placed to the right of the press and inside the viewport

##### Example: Press near the left edge

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 30 y 400, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** the layout side is `right` and every item's x is greater than 30 and less than 400

##### Example: Press near the right edge

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 370 y 400, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** the layout side is `left` and every item's x is less than 370 and greater than 0

#### Scenario: Vertical room is respected

- **WHEN** the press sits near the top or bottom edge
- **THEN** every item stays within the viewport vertically

##### Example: Press near the top

- **GIVEN** a viewport 400 wide and 800 tall, a press at x 30 y 40, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** every item's y is at least 0 and at most 800

#### Scenario: A crowded fan grows instead of overlapping

- **WHEN** the number of items would put adjacent centres closer together than one button
- **THEN** the radius grows until adjacent centres are at least one button apart

##### Example: Eight items at the phone size

- **GIVEN** eight items, a button size of 48, and a base radius of 104
- **WHEN** the fan radius is resolved
- **THEN** it is larger than 104

#### Scenario: The pointer selects the nearest item

- **WHEN** the pointer sits closer to one item centre than any other and within the hit radius
- **THEN** that item is highlighted, and releasing there runs its command

##### Example: Nearest wins

- **GIVEN** items centred at (100, 50) and (100, 150) and a hit radius of 60
- **WHEN** the pointer is at (105, 140)
- **THEN** the second item is selected

#### Scenario: Cancelling runs nothing

- **WHEN** the centre is chosen, a tap lands outside the menu, or Escape is pressed
- **THEN** the menu closes and no command runs

---
### Requirement: Keep the bullet menu inside the visible viewport

Opening the bullet menu SHALL NOT focus the editor, so the software keyboard never appears because of a long press. The menu SHALL lay itself out inside the visible viewport, described by a top offset and a height that the caller takes from the visual viewport when available and from the window height otherwise, and SHALL clamp every item, the centre control, and the caption into that band with a small padding. When the caption cannot fit below the centre it SHALL be placed above it.

#### Scenario: A long press does not raise the keyboard

- **WHEN** the menu opens for a bullet
- **THEN** the editor selection moves to that bullet and the editor is not focused

#### Scenario: Items stay above the keyboard

- **WHEN** the visible viewport is shorter than the window because the keyboard is up
- **THEN** every item sits inside the visible band

##### Example: Keyboard covering the lower half

- **GIVEN** a window 800 tall, a visible band from 0 to 400, a press at x 30 y 380, four items, and a radius of 96
- **WHEN** the layout is computed
- **THEN** every item's y is at least 0 and at most 400

##### Example: Visible band offset from the top

- **GIVEN** a visible band starting at 100 with a height of 300 and a press at x 30 y 380
- **WHEN** the layout is computed
- **THEN** every item's y is at least 100 and at most 400

#### Scenario: The caption flips above a low centre

- **WHEN** the centre sits close to the bottom of the visible band
- **THEN** the caption is placed above the centre instead of below it

---
### Requirement: Animate the bullet menu

The menu SHALL play a short entrance: items fade in and scale up from the centre with a small per-item delay so they appear to spread out, and the centre control fades in with them. The highlighted item SHALL change size through a transition rather than instantly, and item buttons SHALL carry a raised shadow that deepens while highlighted so they read as floating above the note. The caption SHALL show the highlighted item's name and SHALL be empty and hidden when nothing is highlighted. The caption SHALL sit outside the menu's bounding box — above its top edge with a gap, or below its bottom edge when the top would leave the visible band — and SHALL be centred horizontally on that box while staying inside the visible band, so a thumb resting on the centre never covers it. All motion SHALL be disabled when the user's system asks for reduced motion.

#### Scenario: Items animate in sequence

- **WHEN** the menu opens
- **THEN** each item carries an increasing animation delay so they arrive one after another

##### Example: Stagger values

- **GIVEN** three items
- **WHEN** the menu renders
- **THEN** the items' delays increase with their index

#### Scenario: The caption clears the menu

- **WHEN** the menu has room above it
- **THEN** the caption sits above every item and above the centre control

##### Example: Caption above the fan

- **GIVEN** a menu opened at x 40 y 400 in a band 800 tall with four items
- **WHEN** the caption is positioned
- **THEN** its y is smaller than every item's y and smaller than the centre's y

#### Scenario: The caption flips below a menu near the top

- **WHEN** placing the caption above would leave the visible band
- **THEN** it is placed below the menu instead and stays inside the band

##### Example: Menu near the top

- **GIVEN** a menu opened at x 40 y 60 in a band 800 tall with four items
- **WHEN** the caption is positioned
- **THEN** its y is greater than every item's y and inside the band

#### Scenario: The caption only names a highlighted item

- **WHEN** no item is highlighted
- **THEN** the caption holds no text

##### Example: Pointer in the centre

- **GIVEN** an open menu with the pointer inside the dead zone
- **THEN** the caption's text is empty

#### Scenario: Reduced motion is respected

- **WHEN** the stylesheet is inspected
- **THEN** a reduced-motion block disables the menu animation and transitions

---
### Requirement: Suppress the caret while the bullet menu is open

While the bullet menu is open the plugin SHALL stop the editor from taking part in the gesture: it SHALL mark the editor with a state class whose styles make the caret transparent and disable text selection and pointer events on the editor content, and it SHALL blur the editor so the system stops treating the ongoing touch as a caret drag. The plugin SHALL remember whether the editor was focused beforehand and, on every path that closes the menu — choosing an item, the centre control, a tap outside, or Escape — SHALL remove the state class and restore focus when it had been focused, leaving the caret and keyboard as they were before the press.

#### Scenario: The caret disappears while the menu is open

- **WHEN** the menu opens from a long press
- **THEN** the editor carries the state class and no longer has focus

##### Example: State class applied

- **GIVEN** a focused editor
- **WHEN** the menu opens
- **THEN** the editor element carries the menu state class

#### Scenario: Closing restores the editor

- **WHEN** the menu closes by any path
- **THEN** the state class is removed and focus returns if the editor had it

##### Example: Cancel restores focus

- **GIVEN** the menu was opened from a focused editor
- **WHEN** the menu is cancelled
- **THEN** the state class is gone and the editor is focused again

##### Example: Running a command restores focus

- **GIVEN** the menu was opened from a focused editor
- **WHEN** an item is chosen
- **THEN** the state class is gone and the editor is focused again

#### Scenario: An unfocused editor stays unfocused

- **WHEN** the menu closes after opening from an editor that had no focus
- **THEN** the editor is not focused, so the keyboard stays down

#### Scenario: The style blocks caret and selection

- **WHEN** the plugin stylesheet is inspected
- **THEN** the menu state rules make the caret transparent and disable selection and pointer events on the editor content

---
### Requirement: Keep plugin settings within the panel width

Every settings row the plugin creates SHALL carry a plugin-owned class, and the stylesheet SHALL constrain those rows so their controls can shrink and never exceed the panel width: control containers SHALL allow shrinking without wrapping their controls onto separate lines, select and text inputs SHALL be limited to the available width while filling the remaining space, and the name column SHALL keep a minimum width so its text never breaks into single characters. On narrow viewports the row SHALL stack, placing the name and description on one line and the controls on the next. The plugin settings container SHALL also hide horizontal overflow, so the settings tab never scrolls sideways.

#### Scenario: Long command names do not widen the panel

- **WHEN** a slot dropdown lists commands with long names
- **THEN** the dropdown is limited to the available width instead of widening the row

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the plugin settings rules are inspected
- **THEN** they limit select elements to a maximum width and allow the control container to shrink

#### Scenario: The name column stays readable

- **WHEN** a row's name is rendered next to its controls
- **THEN** the name column keeps a minimum width so it is not squeezed to a couple of characters

##### Example: Minimum width present

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the settings info rule is inspected
- **THEN** it declares a minimum width

#### Scenario: Controls stay on one line

- **WHEN** a row holds a dropdown and a toggle
- **THEN** the control container does not wrap them onto separate lines

##### Example: No wrapping

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the control rule is inspected
- **THEN** its flex-wrap is nowrap

#### Scenario: Narrow viewports stack the row

- **WHEN** the viewport is narrow
- **THEN** a media query stacks the name above the controls

##### Example: Stacking query

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** its media queries are inspected
- **THEN** one of them sets the plugin settings row to a column layout

#### Scenario: The settings tab cannot scroll sideways

- **WHEN** the settings container rule is inspected
- **THEN** it hides horizontal overflow and limits its own width

---
### Requirement: Clear a bullet without removing it

The plugin SHALL provide a clear command that removes only the text after the bullet's marker, leaving the marker, its indentation, and every nested child untouched, so an empty bullet remains ready for typing. The command SHALL make no change when the bullet already has no text, and SHALL refuse with a notice when the cursor is not on a supported bullet. It SHALL be available as a command and as a menu slot, and SHALL appear in the default slot configuration.

#### Scenario: Clearing keeps the bullet and its children

- **WHEN** the clear command runs on a bullet that has text and children
- **THEN** only that line's text is removed

##### Example: Clear a parent bullet

- **GIVEN** the document `- Topic\n  - Child` with the cursor on `Topic`
- **WHEN** the clear command runs
- **THEN** the document becomes `- \n  - Child`

#### Scenario: An empty bullet is left alone

- **WHEN** the clear command runs on a bullet whose text is already empty
- **THEN** the planner reports no change

##### Example: Nothing to clear

- **GIVEN** the document `- ` with the cursor on that bullet
- **WHEN** the clear plan is computed
- **THEN** it returns null

---
### Requirement: Separate the bullet menu from the note behind it

The menu overlay SHALL dim the content behind it using Obsidian's modal cover colour together with a slight backdrop blur, so the note recedes and the menu reads as the only active layer, and the dimming SHALL disappear with the menu. The overlay SHALL fade in, and that fade SHALL be disabled under reduced motion. The menu SHALL draw a marker ring at its origin so the bullet being acted on stays identifiable once the background is dimmed.

#### Scenario: The background dims while the menu is open

- **WHEN** the menu opens
- **THEN** the overlay paints the modal cover colour and blurs what is behind it

##### Example: Overlay style audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the overlay rule is inspected
- **THEN** its background uses the modal cover variable and it applies a backdrop blur

#### Scenario: The dimming leaves with the menu

- **WHEN** the menu closes by any path
- **THEN** the overlay is removed from the document, taking the dimming with it

#### Scenario: The target bullet stays identifiable

- **WHEN** the menu opens
- **THEN** a marker ring is drawn at the menu origin

##### Example: Ring position

- **GIVEN** a menu opened at x 40 y 200
- **WHEN** the overlay is inspected
- **THEN** it contains a ring element positioned at that origin

#### Scenario: Reduced motion skips the fade

- **WHEN** the stylesheet is inspected
- **THEN** the reduced-motion block also disables the overlay fade

---
### Requirement: Clip the plugin settings to the panel

The plugin settings tab SHALL mark its own container with a plugin-owned class whose styles prevent horizontal overflow, so no control can widen the panel or make the tab scroll sideways, in addition to the per-row width limits.

#### Scenario: The settings tab cannot scroll sideways

- **WHEN** the settings container rule is inspected
- **THEN** it hides horizontal overflow and limits its own width

---
### Requirement: Size the bullet menu for the device

The bullet menu SHALL be laid out from a named size, resolving a button diameter, an icon size, a base fan radius, a hit radius, and a centre dead zone together, so the geometry and the artwork never disagree. A regular size SHALL keep the phone metrics, and a large size SHALL increase every metric proportionally for tablets. The plugin SHALL request the large size on tablets and the regular size otherwise. The overlay SHALL publish the resolved button and icon sizes as custom properties, and the stylesheet SHALL read those properties instead of hard-coding the numbers, so the icon inside a button scales with the button rather than with the default font size.

#### Scenario: Tablets get a bigger menu

- **WHEN** the large size is resolved
- **THEN** its button, icon, radius, hit radius, and dead zone all exceed the regular size's

##### Example: Large exceeds regular

- **GIVEN** the regular and large metrics
- **WHEN** they are compared
- **THEN** the large button and icon sizes are strictly greater

#### Scenario: The overlay carries its metrics

- **WHEN** the menu opens with a given size
- **THEN** the overlay declares the button and icon sizes as custom properties, and the buttons take their size from them

##### Example: Custom properties on the overlay

- **GIVEN** the menu opened at the large size
- **WHEN** the overlay element is inspected
- **THEN** it declares a button size property matching the large button size

#### Scenario: The stylesheet reads the metrics

- **WHEN** the menu rules are inspected
- **THEN** the button rule sizes itself from the button property and the icon rule sizes itself from the icon property

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the radial item rule is inspected
- **THEN** its width references the button custom property

---
### Requirement: Choose the icon for each menu slot

Each menu slot SHALL expose its icon through a single control: a preview button that draws the icon the menu would use and opens an icon picker when activated. There SHALL be no icon id text field, so configuring a slot never requires knowing an id. An icon id stored by an earlier version SHALL keep working, and an icon id that does not exist SHALL leave the slot with the command's icon rather than an empty button. Changing the command SHALL keep an explicitly chosen icon, and a slot with no chosen icon SHALL use the command's icon, falling back to a neutral marker icon when the command has none.

The picker SHALL show a search box and a grid in which every entry draws the actual icon above a readable name derived from its id, SHALL limit how many entries it draws at once so opening it stays fast, and SHALL filter as the search text changes, preferring entries whose name starts with the search text. Choosing an entry SHALL apply it to the slot, updating the preview and the stored settings together. The picker SHALL also offer a way to clear the icon, returning the slot to the command's icon.

#### Scenario: The icon has one control

- **WHEN** a slot row is rendered
- **THEN** it shows a number, an icon button, a command picker, and an enable switch, and no icon id field

##### Example: Slot row controls

- **GIVEN** the settings tab is open
- **WHEN** a slot row is inspected
- **THEN** it contains exactly one icon control, the preview button

#### Scenario: A configured icon wins over the command's icon

- **WHEN** a slot has both an icon id and a command that carries its own icon
- **THEN** the menu renders the slot's icon

##### Example: Resolution order

- **GIVEN** a slot icon `star`, a command icon `copy`, and a default `circle-dot`
- **WHEN** the icon is resolved
- **THEN** the result is `star`

##### Example: Falling back

- **GIVEN** an empty slot icon and a command without an icon
- **WHEN** the icon is resolved
- **THEN** the result is the default icon

#### Scenario: Icon ids are persisted and normalized

- **WHEN** settings are loaded
- **THEN** each slot's icon is a trimmed string, defaulting to empty for settings saved before the field existed

##### Example: Older records gain an empty icon

- **GIVEN** stored slots `{copy, enabled, icon: "  star  "}` and `{delete, enabled}`
- **WHEN** the settings are normalized
- **THEN** the first icon is `star` and the second icon is empty

#### Scenario: The preview opens a picker

- **WHEN** the icon button of a slot is activated
- **THEN** an icon picker opens for that slot, and choosing an entry applies it to the preview and the settings

##### Example: Picking a star

- **GIVEN** slot 1 holding the copy command with no icon
- **WHEN** the icon button is activated and `star` is chosen
- **THEN** the slot icon becomes `star` and the preview draws the star

#### Scenario: The picker filters by name

- **WHEN** search text is entered
- **THEN** only matching entries are listed, those whose name starts with the text first, capped at the display limit

##### Example: Prefix matches lead

- **GIVEN** the ids `lucide-star`, `lucide-star-off`, and `lucide-align-left` and the search text `star`
- **WHEN** the list is filtered
- **THEN** it holds `lucide-star` and `lucide-star-off`, in that order

##### Example: The list is capped

- **GIVEN** five hundred ids and an empty search text
- **WHEN** the list is filtered with a limit of one hundred and twenty
- **THEN** it holds one hundred and twenty entries

#### Scenario: Names are readable

- **WHEN** an entry is labelled
- **THEN** its name drops the icon set prefix and reads as words

##### Example: Label for a lucide id

- **GIVEN** the id `lucide-file-output`
- **WHEN** it is labelled
- **THEN** it reads `file output`

#### Scenario: Clearing returns to the command icon

- **WHEN** the picker's clear option is chosen
- **THEN** the slot icon becomes empty and the preview shows the command's icon

##### Example: Clearing a chosen icon

- **GIVEN** slot 1 holding the copy command with the icon `star`
- **WHEN** the clear option is chosen
- **THEN** the slot icon becomes empty and the preview draws the copy icon

---
### Requirement: Edit menu slots in a compact list

The menu slots SHALL be rendered as a plugin-owned list rather than as one standard settings row each, so eight slots stay readable on a tablet. Each slot row SHALL show, in order, its number, the icon button, the command picker, and the enable switch, laid out on one line while there is room and wrapping only when there is not, with the command picker taking the free space. Changing a control SHALL update the row immediately without redrawing the tab.

#### Scenario: A slot row stays on one line

- **WHEN** the slot list is rendered on a wide panel
- **THEN** each row places its number, icon button, command picker, and switch side by side

##### Example: Stylesheet audit

- **GIVEN** the plugin stylesheet is loaded
- **WHEN** the slot row rule is inspected
- **THEN** it lays the row out as a flex line whose command picker takes the free space

#### Scenario: The preview follows the configuration

- **WHEN** a slot's command or icon changes
- **THEN** the icon button shows the icon the menu would draw

##### Example: Switching command

- **GIVEN** slot 1 holding the copy command with no chosen icon
- **WHEN** its command changes to delete
- **THEN** the icon button switches to the delete command's icon

---
### Requirement: Cut a bullet with its children

The plugin SHALL register a `Cut bullet` command that copies the bullet at the cursor together with every nested child to the clipboard and then removes that whole branch, including its line break. The copy SHALL happen first and the removal SHALL run only after the clipboard write succeeds, so a failed copy never destroys content. The command SHALL report what happened, and SHALL do nothing when the cursor is not on a supported bullet. Cutting SHALL always include the children regardless of the copy scope setting, and the command SHALL be available from the command palette, from hotkeys, and as a menu slot.

#### Scenario: Cutting removes the branch after copying it

- **WHEN** the cut command runs with the cursor on a bullet that has children
- **THEN** the clipboard holds the bullet and its children, and the branch is gone from the note

##### Example: A branch is cut

- **GIVEN** the document `- A\n- Topic\n  - P1\n- B` with the cursor on `Topic`
- **WHEN** the cut command runs and the clipboard write succeeds
- **THEN** the clipboard holds `- Topic\n  - P1` and the document becomes `- A\n- B`

#### Scenario: A failed copy leaves the note alone

- **WHEN** the clipboard write fails
- **THEN** the document is unchanged and a notice explains that the bullet could not be cut

##### Example: Clipboard refused

- **GIVEN** the document `- A\n- Topic\n  - P1`
- **WHEN** the cut command runs and the clipboard write fails
- **THEN** the document is still `- A\n- Topic\n  - P1`

#### Scenario: Cutting refuses a non-bullet cursor

- **WHEN** the cut command runs while the cursor sits on a plain paragraph
- **THEN** the document is unchanged and a notice explains what to do

##### Example: Cursor on a paragraph

- **GIVEN** the document `Just a paragraph` with the cursor inside it
- **WHEN** the cut command is checked
- **THEN** it reports that it cannot run

---
### Requirement: Match the list you paste into

When list content is pasted while the cursor sits on a list line, the plugin SHALL rewrite the pasted branch to belong to that list before inserting it, and SHALL leave every other paste to Obsidian. Each pasted line SHALL keep its depth relative to the branch root while being shifted to the target line's indentation, so children stay nested under the pasted parent. Each pasted marker SHALL adopt the target list's style: the target's bullet character when the target is unordered, or a fresh number per level when the target is ordered. Lines that are not list items, such as wrapped continuation text, SHALL be carried along with the same shift. Pasting into a list item that has no content SHALL replace that line rather than leaving an empty marker above the branch, and pasting into a list item that has content SHALL insert the branch on the following lines. The behavior SHALL be governed by a setting that defaults to on, and SHALL apply only to a collapsed cursor.

#### Scenario: A numbered branch becomes bulleted

- **WHEN** a branch copied from a numbered list is pasted into an unordered list
- **THEN** every pasted line uses the target list's bullet character

##### Example: Numbered into dashes

- **GIVEN** the clipboard holds `1. Topic\n\t1. Child` and the cursor is on `- Alpha`
- **WHEN** the paste is planned
- **THEN** the inserted text is `\n- Topic\n\t- Child`

#### Scenario: Children stay nested

- **WHEN** a branch is pasted onto an indented line
- **THEN** each pasted line keeps its depth relative to the branch root, measured from the target line's indentation

##### Example: Pasting under a nested bullet

- **GIVEN** the clipboard holds `1. Topic\n\t1. Child` and the cursor is on a line indented by one tab
- **WHEN** the paste is planned
- **THEN** the inserted text indents `Topic` by one tab and `Child` by two

#### Scenario: An ordered target renumbers the branch

- **WHEN** the target list is ordered
- **THEN** the pasted lines are numbered per level, restarting under each new parent

##### Example: Bullets into a numbered list

- **GIVEN** the clipboard holds `- Topic\n\t- Child\n\t- Second child\n- Sibling` and the cursor is on `1. Alpha`
- **WHEN** the paste is planned
- **THEN** the inserted text is `\n1. Topic\n\t1. Child\n\t2. Second child\n2. Sibling`

#### Scenario: An empty bullet is filled

- **WHEN** the cursor sits on a list item with no content
- **THEN** the plan replaces that whole line instead of inserting below it

##### Example: Pasting into a fresh bullet

- **GIVEN** the document `- Alpha\n\t- ` with the cursor at the end
- **WHEN** the paste is planned
- **THEN** the plan replaces the second line and its text starts with one tab

#### Scenario: Other pastes are left alone

- **WHEN** the clipboard is not a list, the cursor is not on a list line, or the setting is off
- **THEN** the plugin does not intervene and Obsidian pastes normally

##### Example: Plain text

- **GIVEN** the clipboard holds `Just text` and the cursor is on `- Alpha`
- **WHEN** the paste is planned
- **THEN** there is no plan

---
### Requirement: Show only the menu settings that apply

The bullet menu section SHALL present one control for what a bullet marker does, offering exactly three choices: open the menu on tap, zoom on tap with no menu, or zoom on tap with the menu on a long press. That choice SHALL be stored in the existing enable and marker-tap settings, so no stored settings need migrating. The section SHALL then show only the settings the choice actually uses: the press duration SHALL appear only for the long-press choice, and the slot list SHALL appear only when the menu can be opened at all. The settings that depend on the choice SHALL live in their own container, and changing the choice SHALL rebuild only that container, leaving every other row, the scroll position, and the control the user just touched exactly where they were.

#### Scenario: Zooming hides the menu settings

- **WHEN** the marker is set to zoom with no menu
- **THEN** neither the press duration nor the slot list is shown

##### Example: Zoom only

- **GIVEN** the marker choice is zoom with no menu
- **WHEN** the settings tab renders
- **THEN** the bullet menu section contains only the marker choice

#### Scenario: Tapping to open the menu hides the press duration

- **WHEN** the marker is set to open the menu on tap
- **THEN** the slot list is shown and the press duration, which only governs long presses, is not

##### Example: Stored values for the tap choice

- **GIVEN** the open-the-menu choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `menu`

#### Scenario: The long-press choice shows everything

- **WHEN** the marker is set to zoom with the menu on a long press
- **THEN** both the press duration and the slot list are shown

##### Example: Stored values for the long-press choice

- **GIVEN** the long-press choice
- **WHEN** it is saved
- **THEN** the menu stays enabled and the marker tap action is `zoom`

#### Scenario: Switching the choice does not move the page

- **WHEN** the marker choice changes
- **THEN** only the dependent settings are rebuilt, and the rest of the tab keeps its position

##### Example: Scroll position survives

- **GIVEN** the settings tab scrolled down to the bullet menu section
- **WHEN** the marker choice changes
- **THEN** the section stays under the user's finger instead of jumping to the top

---
### Requirement: Keep headings out of bullets while typing

The plugin SHALL watch every document change and, when a line the change touched becomes a list item with no indentation whose content is a heading, SHALL remove that list marker in the same transaction, so the heading works and one undo reverts both the typing and the correction. Only lines the change touched SHALL be inspected, indented list items SHALL be left alone because a heading cannot be indented, and a hash without following whitespace SHALL NOT count as a heading. The guard SHALL run whether or not a focus session is active, SHALL never run again on its own correction, and SHALL be governed by a setting that defaults to on.

#### Scenario: A continued list item stops swallowing a heading

- **WHEN** the editor starts a new list item and a heading is typed into it
- **THEN** the marker is removed and the line is left as a plain heading

##### Example: Typing a heading into a fresh item

- **GIVEN** the document `- Topic\n- ` with the cursor at the end
- **WHEN** `# Outline` is typed
- **THEN** the document becomes `- Topic\n# Outline`

#### Scenario: Only the edited lines are considered

- **WHEN** a change touches one line while another line already holds a swallowed heading
- **THEN** the untouched line is left exactly as it is

##### Example: Editing elsewhere

- **GIVEN** the document `- # Kept\n- Topic`
- **WHEN** `!` is appended to the second line
- **THEN** the document becomes `- # Kept\n- Topic!`

#### Scenario: Indented items and tags are not touched

- **WHEN** the line is an indented list item holding a heading, or its content is a hash without a space
- **THEN** nothing is removed

##### Example: A tag stays a tag

- **GIVEN** the line `- #tag`
- **WHEN** the guard inspects it
- **THEN** no change is planned

#### Scenario: The guard can be turned off

- **WHEN** the setting is off
- **THEN** the marker stays and the editor behaves exactly as Obsidian does

##### Example: Guard disabled

- **GIVEN** the setting is off and the document `- Topic\n- `
- **WHEN** `# Outline` is typed
- **THEN** the document becomes `- Topic\n- # Outline`

---
### Requirement: Resolve command names and icons from the registry

The plugin SHALL resolve command names and icons from Obsidian's command registries, which list every registered command regardless of whether it can run at this moment, and SHALL fall back to the context-filtered command listing only when the registries are unavailable. Entries SHALL be de-duplicated by id, keeping the first, and an entry with no name SHALL fall back to its id. A registry that is missing, malformed, or that throws SHALL yield no entries rather than an error. The plugin SHALL remember the last catalog that contained entries and use it when a later read returns nothing, so the menu never loses its names and icons. Both the bullet menu and the slot pickers in settings SHALL use this catalog.

#### Scenario: The menu keeps its icons without an active editor

- **WHEN** the bullet menu opens while no editor command can currently run
- **THEN** every slot still shows its command's name and icon

##### Example: Registries win over the listing

- **GIVEN** a registry holding an editor command and a listing that returns nothing
- **WHEN** the catalog is read
- **THEN** the editor command is present with its icon

#### Scenario: The listing is a fallback

- **WHEN** the registries are absent
- **THEN** the catalog is built from the command listing

##### Example: Listing only

- **GIVEN** only a listing that returns one command
- **WHEN** the catalog is read
- **THEN** that command is the single entry

#### Scenario: A broken registry is survivable

- **WHEN** the registry is missing, holds the wrong shape, or throws while listing
- **THEN** the catalog is empty and nothing is thrown

##### Example: Hostile input

- **GIVEN** a registry whose `commands` value is a number
- **WHEN** the catalog is read
- **THEN** the result is empty
