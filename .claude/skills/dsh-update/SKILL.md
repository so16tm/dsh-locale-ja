---
name: dsh-update
description: DeepSeek Harness（DSH）の新しい版にこの日本語ロケールを追従させるとき。英語原文の再抽出、未訳・英語変更キーの翻訳、互換性確認、peer 版の更新、PR 作成までを行う。
---

# DSH の新しい版への追従

引数は対象の版か dist-tag（例: `0.2.1-alpha.2`、`next`）。省略時は `next`。
人が起動する手動の手順で、定期実行はしない。

## 1. 原文の取得と差分

```bash
pnpm install
pnpm sync <版>
```

- npm から `@deepseek-ai/dsh@<版>` をスクリプト無効で `.dsh-cache/<版>/` に取得し、`sources/en.json` を書き換える。
- 本体から消えたキーは `translations/ja.json` から自動で除かれる。
- 抽出が `Could not extract` で失敗したら、上流の登録形式が変わっている。`scripts/lib/extract.mjs` を直し、その版の英語辞書を漏れなく読めるようになるまで先へ進まない。
- 出力の件数（追加・変更・削除・未訳）を控えておく。PR の本文に使う。

## 2. 互換性の確認（翻訳より先に）

前の版と新しい版で、次の公開面が変わっていないかを比べる。

```bash
diff .dsh-cache/<前の版>/node_modules/@deepseek-ai/dsh-client-locale/lib/types/client/index.d.ts \
     .dsh-cache/<版>/node_modules/@deepseek-ai/dsh-client-locale/lib/types/client/index.d.ts
```

- 使っているのは `register` / `addLanguage` / `getLocale` / `subscribe` だけ（`src/types.ts`）。このいずれかのシグネチャか意味が変わっていたら、翻訳に入る前に止めてユーザーに報告する。
- 応答言語の指示（`src/index.ts`）が使う公開面を確認する。`@deepseek-ai/dsh-system-prompt` の `section()`、`@deepseek-ai/dsh-settings` の `describe()`、`dsh-client-locale/lib/index.js` の設定名（`locale` / `preference`）の差分を見て、変わっていたら直す。devDependencies のこの2つも新しい版に揃える。
- フォントのトークン名（`--dsw-font-family`、`--ds-font-family-code`）が新しい版の CSS に残っているかを `grep -r` で確認する。消えていたら `src/font.ts` を直す。
- client manifest（`dsh.client`・`dsh.bundle.patch`）の仕様が変わっていないかを、`dsh-client-modules` と `dsh-plugin-manager` の差分で確認する。

## 3. 翻訳

作業リストは `.dsh-cache/sync-report.json` の `todo`。キーごとに次の項目がある。

- `en`：新しい英語原文
- `previousEn`：英語が変わったキーのみ、前の英語原文
- `currentJa`：既存の訳がある場合のみ

進め方:

1. `docs/translation-guide.md` の用語集と文体に従う。ボタンや見出しは短く句点なし、説明やエラーは「です・ます」。`{name}` などの置換は名前も個数もそのまま保つ。
2. 迷うキーは、`sources/en.json` の `packages[名前空間]` で所属パッケージを特定する。`.dsh-cache/<版>/node_modules/@deepseek-ai/<パッケージ>/lib/client.js` で、そのキーの使われ方と中国語（`zh`）の訳を確認する。
3. `previousEn` があるキーは英語の変化を読み、`currentJa` を直す必要があるかを判断する。直す必要がなければ `currentJa` をそのまま出力に含めてよい。
4. 結果を `{ "名前空間": { "キー": "訳" } }` の形で `.dsh-cache/translations-<版>.json` に書き、取り込む。

```bash
pnpm apply .dsh-cache/translations-<版>.json
pnpm coverage --strict
```

意図的に英語のまま残すキーは `sources/accepted-fallbacks.json` に追加する（空白だけの区切り文字など）。

## 4. 版の更新と検証

```bash
pnpm add -D --save-exact @deepseek-ai/dsh-client-locale@<版>
```

- 前の版の利用者を残す（例：新版が alpha で、latest はまだ前の版）なら、手順1を `pnpm sync <版> --keep-stale` で実行する。新版で消えたキーの訳が残り、`sources/older-keys.json` に記録される。`peerDependencies["@deepseek-ai/dsh-client-locale"]` は `前の版 || <版>` のように、検証した版を `||` で列挙する。
- 前の版の対応をやめるときは `--keep-stale` なしで sync し、peer を `<版>` だけにする。
- DSH は peer の範囲外の版で、プラグインを互換性なしとして扱う（`dsh plugin allow-version` で許可が必要）。範囲には実際に確認した版だけを書く。
- 版を上げる。`package.json` の `version` のマイナー版を上げ（`0.1.0` → `0.2.0`）、`CHANGELOG.md` の先頭に `## v<新しい版>` の節を追加する。節には `対応 DSH:` の行と主な変更点を書く。
- README の対応表に新しい版の行を追加し、インストール例のタグも新しい版にする。
- タグは自分で付けない。PR のマージ後に CI が `v<版>` のタグとリリースを作成する。
- `pnpm check` を実行し、生成された `lib/` もコミットする（リポジトリから直接インストールされるため。CI が一致を検査する）。テストは新しい版の実際の `LocaleRuntime` で、登録・切替・解除を確認する。

## 5. PR

- ブランチ名は `update/dsh-<版>`、ベースは `main`。PR のタイトルにプラグインの新しい版を含める。
- PR の本文に次を書く。
  - 版の移行（前 → 後）
  - 英語原文の追加・変更・削除の件数と翻訳率
  - 互換性確認の結果
  - 自信の低い訳（文脈から判断しきれなかったキー）の一覧
- 実機での確認はユーザーに依頼する。手順は次のとおり。

```bash
pnpm pack
dsh plugin --profile web add "$(pwd)/so16tm-dsh-locale-ja-<パッケージ版>.tgz"
dsh web
```

確認したら Settings → General → Language で「日本語」を選び、主要画面で表示崩れがないかを見てもらう。
