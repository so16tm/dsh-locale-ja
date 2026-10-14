<p align="center">
  <img src="docs/images/readme-header.webp" alt="dsh-locale-ja — Japanese UI for DeepSeek Harness" width="960" />
</p>

# dsh-locale-ja

[English](README.md) | [日本語](README.ja.md)

DeepSeek Harness（DSH）の Web UI に日本語を追加するプラグインです。本体は変更せず、DSH が公開している言語パック API を使います。

## 機能

- DSH の Web UI を日本語化します。空白だけの区切り文字は原文をそのまま使います。
- 古い対応版で必要な訳も残しています。各版の翻訳状況は CHANGELOG.md に記録しています。
- UI で日本語を明示的に選択している間、AI に日本語での応答を指示します。ユーザーが別の応答言語を指定することもできます。

## 対応バージョン

使用中の DSH に対応する版を [GitHub Releases](https://github.com/so16tm/dsh-locale-ja/releases) から選んでください。対応・検証済みの DSH、版ごとの変更点は、各リリースの説明と [CHANGELOG.md](CHANGELOG.md) に記録しています。

機械的な要件判定に使う値は、選んだタグの [package.json](package.json) の `peerDependencies` と `engines` を参照してください。

`web` プロファイルで使います。対応範囲内でも未検証の DSH では、新しく増えた文字列が翻訳の追加まで英語で表示される場合があります。

## インストール

使っている DSH に対応する版のタグを指定して、リポジトリから直接入れます。ビルド済みの `lib/` をリポジトリに含めています。

以下の `<tag>` は、[GitHub Releases](https://github.com/so16tm/dsh-locale-ja/releases) で選んだ版のタグ名全体に置き換えてください。

```sh
dsh plugin --profile web add 'git+https://github.com/so16tm/dsh-locale-ja.git#<tag>'
dsh web
```

このリポジトリは非公開です。リポジトリへのアクセス権があるアカウントで GitHub 認証を設定し、Git をインストールしてから実行してください。

アプリ画面の **Plugins → Add plugin** に `git+https://github.com/so16tm/dsh-locale-ja.git#<tag>` と入力しても入れられます。タグを付けずに指定すると、まだ版として公開していない `main` の最新が入ります。

更新するときは、削除せずに新しい版のタグで同じ `add` コマンドを実行し、`dsh web` を再起動してください。入っている版が新しい版に置き換わります。

削除するときは次を実行します。

```sh
dsh plugin --profile web remove @so16tm/dsh-locale-ja
```

## 使い方

**Settings → General → Language** で **日本語** を選びます。選択は DSH の設定に保存されます。

日本語を明示的に選んでいる間、このプラグインは日本語で応答するよう AI に指示する一文をシステムプロンプトに加えます。DSH の既定のプロンプトには応答言語の指定がないため、ツールの出力やファイルの言語に引きずられて、応答が英語や中国語に切り替わることがあります。

- 言語を切り替えると、次の応答から反映されます。
- 日本語以外を選んでいるときや、言語を明示的に選んでいない（ブラウザー任せの）ときは、何も加えません。
- DSH をループバック以外のアドレス（LAN 内の別の PC など）から開くと、言語の選択は DSH 側に保存されないため、この指示は加わりません。
- ユーザーが別の言語を明示的に頼んだときは、その言語で応答します。

## 設定

応答言語の指示が不要な場合は、プロファイルの `cordis.patch.yml` に次を追加すると無効になります。

```yaml
- id: so16tm-locale-ja
  config:
    replyInUiLanguage: false
```

## 制限事項

他の日本語化プラグイン（`@fang2hou/dsh-locale-ja` など）とは同時に有効にできません。先に削除してください。

## 開発

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` は型チェック、ビルド、テスト、翻訳率の確認、リリースノートの検証を実行します。

### 本体の新しい版に追従する

Claude Code では `/dsh-update <版>` で、翻訳・互換性確認・PR 作成までをまとめて実行できます（[スキル](.claude/skills/dsh-update/SKILL.md)）。手作業で行う場合は次のとおりです。

```sh
pnpm sync next
```

引数には版または dist-tag を指定します。省略時は `next` です。npm から指定版の DSH をスクリプト無効で `.dsh-cache/` に取得し、配布コードを静的解析して英語原文を `sources/en.json` に書き出します。前の版と比べた追加・変更・削除の件数と翻訳率を表示します。訳すべきキー（未訳、または英語が変わったもの）は `.dsh-cache/sync-report.json` の `todo` に英語原文つきで出力されます。

前の版は引き続き対応版として扱います。前の版にしかないキーや英語が違うキーは、その英語とともに `sources/older.json` に残り、訳も消えません。訳はどの版の英語にも合う言い回しにします（`todo` の `olderEn`）。古い版の対応をやめるときだけ `--drop-older` を付けます。前の版の英語の記録と、新しい版で消えたキーの訳がまとめて消えます。

訳した結果は `{ "名前空間": { "キー": "訳" } }` 形式の JSON にまとめ、次のコマンドで取り込みます。

```sh
pnpm apply path/to/new-translations.json
pnpm coverage
```

存在しないキーや `{name}` 置換の不一致は拒否されます。`pnpm coverage --strict` は未訳があれば失敗します。

### 版の公開

版は `package.json` の `version` とタグ `v<版>` で管理します。

1. PR で `version` を上げ、[CHANGELOG.md](CHANGELOG.md) に `## v<版>` の節（対応 DSH と変更点）を追加します。節がないと `pnpm check` が失敗します。
2. PR を `main` にマージすると、CI がタグ `v<版>` と GitHub のリリースを自動で作成します。

新しい DSH への対応や訳の追加・変更はマイナー版、誤訳の修正などはパッチ版を上げます。

設計上の約束事は [ARCHITECTURE.md](ARCHITECTURE.md) を参照してください。

README の両言語版は使い方が変わるときに更新し、版番号と対応情報は CHANGELOG.md に記録します。CI は該当する版の CHANGELOG の節を GitHub リリースの説明に使います。

## ライセンス

[MIT](LICENSE)。参考にしたプロジェクトは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載しています。
