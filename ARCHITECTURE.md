# Architecture

本体（DeepSeek Harness）を一切変更せず、公開 API だけで日本語 UI を足すための約束事です。

## 守ること

1. **公開 API のみ**：`locale.register(ns, 'ja', dict)` と `locale.addLanguage({ id: 'ja', label: '日本語', fallback: 'en' })` だけを使う。`setLocale` のラップや内部フィールドの操作、独自の保存領域は持たない。言語の選択は本体の Host 設定が保存する。
2. **登録順と後始末**：辞書を先に、言語を最後に登録する（保存済みの `ja` が不完全な辞書で有効化されないように）。途中で失敗したら巻き戻し、停止時は逆順にすべて解除する。副作用はすべて `ctx.effect` が所有する。
3. **ブラウザー側バンドルは自己完結**：`lib/client.js` は DSH の ModuleLoader 形式で、`require()` を含まない。`@deepseek-ai/*` は型と開発用依存のみ。ビルドが検査する。
4. **Host 側は空**：`src/index.ts` は `cordis.patch.yml` で Loader 行をマウントするためだけに存在する。
5. **フォントは日本語選択中だけ**：`:where(:root, body)` で UI・コードのフォントトークンを上書きし、他の言語に切り替えたら取り除く。Web フォントは取得しない。
6. **訳はデータ、コードは英語**：日本語は `translations/ja.json`（名前空間 → キー → 訳）にだけ置く。`locale/*.json` はこのプラグイン自身の表示名・説明で、DSH が `resolveText()` で読む別物。
7. **peer は検証済みの版に固定**：`peerDependencies` の `@deepseek-ai/dsh-client-locale` には検証を終えた版だけを列挙する。

## ファイル

- `src/client.ts` — ブラウザー側の入口。辞書・言語・フォントの effect を登録する。
- `src/locale.ts` — トランザクション型の登録と解除。
- `src/font.ts` — 日本語選択中だけ存在する style タグ。
- `scripts/build.mjs` — 型定義、Host ESM、ModuleLoader バンドルの生成と検査。
- `scripts/sync.mjs` — 指定版の DSH を npm から取得し、英語原文の抽出・差分・作業リスト作成を行う（`pnpm sync`）。
- `scripts/lib/extract.mjs`・`static-data.mjs` — 配布コードの `locale.register(...)` を AST から読む。対象パッケージのコードは実行しない。未知の登録形式はエラーにする。
- `scripts/apply.mjs`・`coverage.mjs` — 訳の取り込み（検証つき）と翻訳率の監査。
- `sources/en.json` — 現在対象とする版の英語原文。`sources/accepted-fallbacks.json` は英語のままでよいキー（空白だけの区切り文字など）。
- `tests/` — 実際に配布されている `LocaleRuntime` を読み込んで、登録・切替・解除・巻き戻しを確認する。
