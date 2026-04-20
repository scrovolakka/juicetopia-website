# コードベース全体像（juicetopia-website）

## 1. 技術スタック
- **Astro 5 (SSG)** を基盤にした静的サイト。
- `@astrojs/sitemap` でサイトマップを生成。
- `three` はトップページのヒーロー演出専用。
- 画像は `astro:assets` + `sharp` 前提で最適化。

## 2. 主要ディレクトリ
- `src/pages/`：ルーティング定義（`index.astro`, `novel`, `gallery`, `characters`, `about`, `404`）
- `src/layouts/`：全体レイアウト (`BaseLayout`) と読書特化 (`ReadingLayout`)
- `src/components/`：ヘッダー/フッター、章ナビ、ヒーロー、トグル等
- `src/content/`：小説・ギャラリー・キャラクターのコンテンツ本体（Markdown + 画像）
- `src/content/config.ts`：Astro Content Collections スキーマ
- `src/lib/nav.ts`：グローバルナビとページ配色モード判定
- `src/styles/`：トークン、ベース、演出、ユーティリティ
- `src/plugins/`：remark 拡張（ルビ、縦中横）

## 3. ルーティング設計
- `/` は作品導線用ランディング。3 セクション（NOVEL / GALLERY / CHARACTERS）へ誘導。
- `/novel/` はシリーズ別に章をグルーピングして一覧化。
- `/novel/[...slug]/` は各章本文を生成し、前後章ナビを付与。
- `/gallery/` と `/gallery/[slug]/` で作品一覧・詳細を分離。
- `/characters/` は人物アーカイブ。

## 4. レイアウトとテーマ
- `BaseLayout` がフォント・メタタグ・共通ヘッダー/フッター・遷移演出を集約。
- `modeFor(path)` で **bone / void** の配色テーマを自動切替。
- `ReadingLayout` は小説ページ向けに縦書き/横書き切替 UI と読書レールを提供。

## 5. コンテンツモデル（型）
`src/content/config.ts` で3コレクションを定義：
- `novel`: 章番号、公開日、シリーズ情報など
- `gallery`: タイトル、画像、日付、メディウム、順序
- `characters`: 名前、読み、肖像、ID、並び順

これにより Markdown frontmatter の破綻をビルド時に検出可能。

## 6. データフロー（ビルド時）
1. `getCollection()` でコンテンツを取得
2. 章番号や `order` でソート
3. `getStaticPaths()` で静的パスを確定
4. 各エントリを `entry.render()` して本文を描画

Astro の静的生成モデルに沿った、シンプルで追跡しやすい流れ。

## 7. フロントエンド演出
- 画面全体に grain / scanline / sweep を適用（`prefers-reduced-motion` 配慮あり）。
- 小説本文は縦書き時に横スクロール化し、可読性を維持。
- 画像・人物肖像は `Image` コンポーネント経由でレスポンシブ最適化。

## 8. 設計上の特徴（読み解きポイント）
- **コンテンツ主導**：`src/content` を更新するとページが自動拡張される。
- **責務分離**：ページ（ルート）/ レイアウト / コンポーネント / 型定義が明確。
- **拡張しやすさ**：新シリーズや新ギャラリーは Markdown 追加が中心。
- **表現の一貫性**：ナビID・テーマモード・タイポグラフィが全体で統一。

## 9. まず読むと全体理解が速いファイル
1. `README.md`（サイト目的と構成）
2. `astro.config.mjs`（ビルド・ベースURL・remark設定）
3. `src/content/config.ts`（データモデル）
4. `src/layouts/BaseLayout.astro`（共通UI骨格）
5. `src/pages/novel/[...slug].astro`（動的ページ生成の典型）
6. `src/lib/nav.ts`（ナビ・テーマ判定）

## 10. 次アクション（把握後におすすめ）
- 画面仕様把握：`npm run dev` で `/`, `/novel/`, `/gallery/` を巡回
- データ起点理解：`src/content/novel/*.md` の frontmatter を `config.ts` と照合
- 変更の安全性確認：`npm run build` で型・生成破綻がないか確認
