## 1. 就地更新

- [x] 1.1 依 **Show only the menu settings that apply** 把相依設定放進自己的容器：`src/main.ts` 的設定列可以指定父容器，切換 Marker tap 時只重建該容器；驗證：`npm run build` 通過、實機切換時捲動位置不變。
- [x] 1.2 依 **Reset each size slider to its default with one tap** 讓重設就地更新：`src/main.ts` 保留滑桿元件並直接設值，不再重畫設定頁；驗證：`npm test` 通過、實機按重設不跳動。

## 2. 發布

- [x] 2.1 執行 `npm test`、`npm run lint`、`npm run build` 與 `git diff --check`；驗證：全數通過。
- [ ] 2.2 同步四個版本檔為 `1.22.1`、commit 推送 main、preflight 後建 tag 與雙語 GitHub Release 附三資產；驗證：資產齊全。
