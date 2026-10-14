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

- `package.json` の `peerDependencies["@deepseek-ai/dsh-client-locale"]` を `<版>` に置き換える。辞書は1つの版の原文に合わせて刈り込むため、対応版は常に1つにする。
- README の「対応バージョン」も同じ版に更新する。
- `pnpm check` を実行する。テストは新しい版の実際の `LocaleRuntime` で、登録・切替・解除を確認する。

## 5. PR

- ブランチ名は `update/dsh-<版>`、ベースは `main`。
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
