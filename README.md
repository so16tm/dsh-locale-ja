# dsh-locale-ja

DeepSeek Harness（DSH）の Web UI に **日本語** を追加するプラグインです。本体は変更せず、DSH が公開している言語パック API だけを使います。

> DSH 0.2.0-rc.2 の UI 文字列 2,615 件のうち 2,611 件を収録しています（残り4件は空白だけの区切り文字で、英語のまま使います）。

## 対応バージョン

- DSH `0.2.0-rc.2` の `web` プロファイル

## インストール

リポジトリから直接入れられます（ビルド済みの `lib/` をリポジトリに含めています）。

```bash
dsh plugin --profile web add github:so16tm/dsh-locale-ja
dsh web
```

特定の版に固定する場合は `github:so16tm/dsh-locale-ja#<タグまたはコミット>` と指定します。アプリ画面の **Plugins → Add plugin** に同じ文字列を入力しても入れられます。更新するときは、いったん削除してから入れ直してください。

**Settings → General → Language** で **日本語** を選びます。選択は DSH の設定に保存されます。

他の日本語化プラグイン（`@fang2hou/dsh-locale-ja` など）とは同時に有効にできません。先に削除してください。

### AI の応答言語

このプラグインは、**Settings → General → Language** で選んだ言語で応答するよう AI に指示する一文を、システムプロンプトに加えます。DSH の既定のプロンプトには応答言語の指定がないため、ツールの出力やファイルの言語に引きずられて、応答が英語や中国語に切り替わることがあります。

- 日本語を選んでいれば日本語、English なら英語で応答します。言語を切り替えると、次の応答から反映されます。
- 言語を明示的に選んでいない（ブラウザー任せの）ときは、日本語で応答します。
- ユーザーが別の言語を明示的に頼んだときは、その言語で応答します。

不要な場合は、プロファイルの `cordis.patch.yml` に次を追加すると無効になります。

```yaml
- id: so16tm-locale-ja
  config:
    replyInUiLanguage: false
```

## 開発

```bash
pnpm check   # 型チェック + ビルド + テスト
```

### 本体の新しい版に追従する

Claude Code では `/dsh-update <版>` で、以下の手順と翻訳・互換性確認・PR 作成までをまとめて実行できます（[スキル](./.claude/skills/dsh-update/SKILL.md)）。手作業で行う場合は次のとおりです。

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
