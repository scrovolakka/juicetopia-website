# juicetopia-website

`juicetopia` の公開アーカイブ。小説・キャラクタ・ギャラリーをまとめた、ポストヴェイパーウェイヴ／アート・エレクトロニクス調の記録庫。

**Live**: https://scrovolakka.github.io/juicetopia-website/
**原典**: [`scrovolakka/juicetopia`](https://github.com/scrovolakka/juicetopia)（設定資料・正史）

---

## 構成

| Route | 役割 | Theme |
|---|---|---|
| `/` | 3D ヒーロー（Three.js のローポリ・トーラスノット）＋ワードマーク＋3 セクションリンク | void (`#0A0908`) |
| `/novel/` | 小説インデックス。シリーズ別グルーピング（MAIN LINE / MUD FRAGMENTS / THE FOOTNOTE KING / SHORTS / LONG FORM） | bone (`#EFEBE2`) |
| `/novel/[...slug]/` | 個別章ページ。縦書きチャプターレール、prev/index/next ナビ | bone |
| `/characters/` | 登場人物の単票ページ（dramatis personae） | bone |
| `/gallery/` + `/gallery/[slug]/` | 画像カタログ。`[V.0001] 2026.04.02 · DIGITAL` 形式のメタ | void |
| `/about/` | サイトについて、CREDITS、WORLD NOTES（聖杯・命令詩・果汁化・ジューストニウム・脚注王制・ジューサー） | bone |
| `/404` | not found | bone |

### デザイン
- **ページ単位の bone/void 反転** — `/` と `/gallery/*` は void、それ以外は bone
- **アクセント** — chartreuse (`#D8FF3A`)。ナビ番号、リンクホバーの下線、ルート遷移時のスイープバー限定
- **エフェクト** — SVG grain (`feTurbulence`) + CRT scanlines + リンクホバーの 2px chromatic aberration + 内部遷移 260ms acid sweep。すべて `prefers-reduced-motion` で無効化
- **タイポ** — Space Grotesk / JetBrains Mono / Shippori Mincho B1 / Noto Sans JP（Google Fonts）、ディスプレイは Redaction 70（serif フォールバック）

---

## スタック

- [Astro 5](https://astro.build/) — `output: 'static'`, `trailingSlash: 'always'`
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [`three`](https://threejs.org/) ^0.170 — `/` のヒーローのみ（バンドル隔離）
- [`sharp`](https://sharp.pixelplumbing.com/) — `astro:assets` 経由の画像最適化
- TypeScript / Prettier (+ `prettier-plugin-astro`)

ノード版は [`.nvmrc`](./.nvmrc) を参照。

---

## ローカル開発

```bash
nvm use            # .nvmrc に従う
npm install
npm run dev        # http://localhost:4321/juicetopia-website/
npm run build      # static build → ./dist
npm run preview    # build をローカル確認
```

---

## コンテンツ

`src/content/` 配下の Astro Content Collections で管理。各コレクションは [`src/content/config.ts`](./src/content/config.ts) に zod スキーマで定義。

### `novel/`
小説本文。シリーズ別にネスト：

```
src/content/novel/
├── 01-prologue.md, 02-chapter-one.md, 03-chapter-two.md   # MAIN LINE
├── mud-fragments/    # 泥の断章
├── footnote-king/    # 脚注の王
├── shorts/           # 短編
└── archive/          # 長編
```

frontmatter:

```yaml
---
title: "<TITLE>"
chapterNumber: <int>
publishedAt: 2026-04-15
series: "<SERIES>"        # optional — 省略時は MAIN LINE 扱い
seriesOrder: <int>        # optional — シリーズ内の並び
summary: "<SUMMARY>"      # optional
---
```

### `characters/`
登場人物。線画 SVG 肖像（パレット `#EFEBE2 / #0F0E0C / #D8FF3A`）と短い記述。

### `gallery/`
画像 + メタデータ（`vNumber`, `date`, `medium`）。

---

## 原典との関係

正史・設定資料は [`scrovolakka/juicetopia`](https://github.com/scrovolakka/juicetopia) に集約されている。本リポジトリは原典の小説・キャラ設定を**忠実移植**するための表示レイヤであり、本文の改変はおこなわない（誤字訂正は原典側で）。

コミット接頭辞の規約は [`CLAUDE.md`](./CLAUDE.md) を参照：

- `[Applia Record]` — 正史反映（原典からのインポート、設定追従）
- `[Carotia Ferment]` — 創造的拡張（サイト固有の記録者視点・UI・原典に存在しない補足）

---

## デプロイ

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) が `main` への push と `workflow_dispatch` で発火し、GitHub Pages にデプロイする。

- 公開先：`https://scrovolakka.github.io/juicetopia-website/`
- `astro.config.mjs`：`site: 'https://scrovolakka.github.io'` / `base: '/juicetopia-website'`
- `public/.nojekyll` あり

Pages の Source 設定は **GitHub Actions**。ユーザサイト（`scrovolakka.github.io`）や独自ドメインへ移す場合は `astro.config.mjs` の `base` を `'/'` に変更。
