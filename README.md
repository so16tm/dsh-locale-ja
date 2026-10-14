# dsh-locale-ja

DeepSeek Harness（DSH）の Web UI に **日本語** を追加するプラグインです。本体は変更せず、DSH が公開している言語パック API だけを使います。

> 開発中です。現在は土台（登録・解除・フォント）のみで、翻訳データはこれから統合します。

## 対応バージョン

- DSH `0.2.0-rc.2` の `web` プロファイル

## インストール

```bash
pnpm install
pnpm build
pnpm pack
dsh plugin --profile web add "$(pwd)/so16tm-dsh-locale-ja-0.0.0.tgz"
dsh web
```

**Settings → General → Language** で **日本語** を選びます。選択は DSH の設定に保存されます。

他の日本語化プラグイン（`@fang2hou/dsh-locale-ja` など）とは同時に有効にできません。先に削除してください。

## 開発

```bash
pnpm check   # 型チェック + ビルド + テスト
```

### 本体の新しい版に追従する

```bash
pnpm sync 0.2.1-alpha.2   # 版または dist-tag（省略時は next）
```

npm から指定版の DSH をスクリプト無効で `.dsh-cache/` に取得し、配布コードを静的解析して英語原文を `sources/en.json` に書き出します。前の版と比べた追加・変更・削除の件数と翻訳率を表示し、本体から消えたキーは `translations/ja.json` から取り除きます。訳すべきキー（未訳、または英語が変わったもの）は `.dsh-cache/sync-report.json` の `todo` に英語原文つきで出力されます。

訳した結果は `{ "名前空間": { "キー": "訳" } }` 形式の JSON にまとめ、次のコマンドで取り込みます。存在しないキーや `{name}` 置換の不一致は拒否されます。

```bash
pnpm apply path/to/new-translations.json
pnpm coverage          # 翻訳率の確認（--strict で未訳があれば失敗）
```

設計上の約束事は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## ライセンス

[MIT](./LICENSE)。参考にしたプロジェクトは [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) に記載しています。
