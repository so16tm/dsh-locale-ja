<p align="center">
  <img src="docs/images/readme-header.webp" alt="dsh-locale-ja — 日本語で使う DeepSeek Harness" width="960" />
</p>

# dsh-locale-ja

DeepSeek Harness（DSH）の Web UI に **日本語** を追加するプラグインです。本体は変更せず、DSH が公開している言語パック API だけを使います。

> DSH 0.2.1-alpha.2 の UI 文字列 2,766 件のうち 2,762 件を収録しています（残り4件は空白だけの区切り文字で、英語のまま使います）。0.2.0-rc.2 にしかない文字列の訳も残しています。

## 対応バージョン

`web` プロファイルで使います。プラグインの版ごとの対応 DSH は次のとおりです（各版の変更点は [CHANGELOG.md](./CHANGELOG.md)）。

| プラグイン | 対応 DSH |
| --- | --- |
| `v0.3.0` | `0.2.0-rc.2` 以降の `0.2.x`（確認済み：`0.2.0-rc.2`、`0.2.1-alpha.2`） |
| `v0.2.0` | `0.2.0-rc.2` 以降の `0.2.x`（確認済み：`0.2.0-rc.2`、`0.2.1-alpha.2`） |
| `v0.1.0` | `0.2.0-rc.2`、`0.2.1-alpha.2` |

`v0.2.0` 以降は、確認していない `0.2.x` の DSH でも読み込まれます。そうした版で新しく増えた文字列は、対応版が出るまで英語で表示されます。

## インストール

使っている DSH に対応する版のタグを指定して、リポジトリから直接入れます（ビルド済みの `lib/` をリポジトリに含めています）。

```bash
dsh plugin --profile web add github:so16tm/dsh-locale-ja#v0.3.0
dsh web
```

アプリ画面の **Plugins → Add plugin** に `github:so16tm/dsh-locale-ja#v0.3.0` と入力しても入れられます。タグを付けずに指定すると、まだ版として公開していない `main` の最新が入ります。

更新するときは、削除せずに新しい版のタグで同じコマンドを実行し、`dsh web` を再起動してください。入っている版が新しい版に置き換わります。

**Settings → General → Language** で **日本語** を選びます。選択は DSH の設定に保存されます。

他の日本語化プラグイン（`@fang2hou/dsh-locale-ja` など）とは同時に有効にできません。先に削除してください。

### AI の応答言語

**Settings → General → Language** で **日本語** を選んでいる間、このプラグインは日本語で応答するよう AI に指示する一文を、システムプロンプトに加えます。DSH の既定のプロンプトには応答言語の指定がないため、ツールの出力やファイルの言語に引きずられて、応答が英語や中国語に切り替わることがあります。

- 言語を切り替えると、次の応答から反映されます。
- 日本語以外を選んでいるときや、言語を明示的に選んでいない（ブラウザー任せの）ときは、何も加えません。
- DSH をループバック以外のアドレス（LAN 内の別の PC など）から開くと、言語の選択は DSH 側に保存されないため、この指示は加わりません。
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

npm から指定版の DSH をスクリプト無効で `.dsh-cache/` に取得し、配布コードを静的解析して英語原文を `sources/en.json` に書き出します。前の版と比べた追加・変更・削除の件数と翻訳率を表示します。訳すべきキー（未訳、または英語が変わったもの）は `.dsh-cache/sync-report.json` の `todo` に英語原文つきで出力されます。

前の版は引き続き対応版として扱います。前の版にしかないキーや英語が違うキーは、その英語とともに `sources/older.json` に残り、訳も消えません。訳はどの版の英語にも合う言い回しにします（`todo` の `olderEn`）。古い版の対応をやめるときだけ `--drop-older` を付けます。前の版の英語の記録と、新しい版で消えたキーの訳がまとめて消えます。

訳した結果は `{ "名前空間": { "キー": "訳" } }` 形式の JSON にまとめ、次のコマンドで取り込みます。存在しないキーや `{name}` 置換の不一致は拒否されます。

```bash
pnpm apply path/to/new-translations.json
pnpm coverage          # 翻訳率の確認（--strict で未訳があれば失敗）
```

### 版の公開

版は `package.json` の `version` とタグ `v<版>` で管理します。

1. PR で `version` を上げ、[CHANGELOG.md](./CHANGELOG.md) に `## v<版>` の節（対応 DSH と変更点）を追加し、README の対応表を更新します。節がないと `pnpm check` が失敗します。
2. PR を `main` にマージすると、CI がタグ `v<版>` と GitHub のリリースを自動で作成します。

新しい DSH への対応や訳の追加・変更はマイナー版（`0.1.0` → `0.2.0`）、誤訳の修正などはパッチ版（`0.1.0` → `0.1.1`）を上げます。

設計上の約束事は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## ライセンス

[MIT](./LICENSE)。参考にしたプロジェクトは [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) に記載しています。
