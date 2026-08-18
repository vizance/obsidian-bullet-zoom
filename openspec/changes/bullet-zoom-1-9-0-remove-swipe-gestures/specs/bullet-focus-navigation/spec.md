## REMOVED Requirements

### Requirement: Act on bullets with horizontal swipes

**Reason**: 橫向滑動與 Obsidian 行動版原生抽屜手勢共用同一個通道，實機上兩者無法並存，手勢會干擾一般的捲動與抽屜操作。

**Migration**: Bullet 的複製與前綴操作改由後續的選單式入口提供；在此之前可使用指令面板與既有的聚焦、拆分功能。設定中的 `Swipe gestures` 區塊已移除，相關設定值不再讀取。

### Requirement: Confine the mobile drawer swipe to the screen edge

**Reason**: 守門是為了讓滑動手勢可用而存在；滑動手勢移除後，壓制原生抽屜手勢已無必要，且會改變使用者熟悉的操作範圍。

**Migration**: 抽屜手勢回到 Obsidian 原生行為，不需要任何設定；外掛不再監聽 window 的觸控事件。
