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

設計上の約束事は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## ライセンス

[MIT](./LICENSE)。参考にしたプロジェクトは [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) に記載しています。
