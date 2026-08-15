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

Each size slider setting SHALL include a reset extra button that, when activated, sets the corresponding scale back to 100, persists the change, reapplies the scale custom properties, and re-renders the settings tab so the slider control reflects 100.

#### Scenario: Reset the title slider

- **WHEN** the user taps the reset button next to the focus title slider
- **THEN** the persisted title scale becomes 100, the body custom property becomes `1`, and the re-rendered slider shows 100

##### Example: Reset after adjustment

- **GIVEN** the title scale is 130
- **WHEN** the reset button of the title slider is activated
- **THEN** the persisted data records `titleScale: 100` and the slider control value is `100`

#### Scenario: Reset the outline slider independently

- **WHEN** the user taps the reset button next to the outline slider while the title scale is 130
- **THEN** only the outline scale returns to 100 and the title scale stays 130

##### Example: Independent reset

- **GIVEN** persisted data `{ "titleScale": 130, "outlineScale": 85 }`
- **WHEN** the outline reset button is activated
- **THEN** the persisted data becomes `{ "titleScale": 130, "outlineScale": 100 }`
