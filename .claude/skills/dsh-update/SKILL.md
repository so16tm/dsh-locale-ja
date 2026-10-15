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
- 前の版は対応版として残る。前の版にしかないキーや英語が違うキーは、その英語とともに `sources/older.json` に記録され、訳も残る。
- 古い版の対応をやめるとき（peer の下限を上げるとき）だけ `pnpm sync <版> --drop-older` を使う。記録と、新しい版で消えたキーの訳が消える。
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
- フォントのトークン（`--dsh-font-family-text-default`、`--dsh-font-family-code-default`、`--dsw-font-family`、`--ds-font-family-code`）が、新しい版の `dsh-client-ui-theme` の CSS でどのセレクターにどう定義されているかを確認する。名前が残っているかだけでなく、利用者のフォント設定（body の `--dsh-font-family-text` など）がどこで合流するかを見る。変わっていたら `src/font.ts` を直す。プラグインが上書きしてよいのは本体の既定の書体スタックだけで、利用者の設定より優先してはいけない。
- client manifest（`dsh.client`・`dsh.bundle.patch`）の仕様が変わっていないかを、`dsh-client-modules` と `dsh-plugin-manager` の差分で確認する。

## 3. 翻訳

作業リストは `.dsh-cache/sync-report.json` の `todo`。キーごとに次の項目がある。

- `en`：新しい英語原文
- `previousEn`：英語が変わったキーのみ、前の英語原文
- `olderEn`：古い対応版で英語がない・違うキーのみ、その版の英語原文（`sources/older.json`）
- `currentJa`：既存の訳がある場合のみ

進め方:

1. `docs/translation-guide.md` の用語集と文体に従う。ボタンや見出しは短く句点なし、説明やエラーは「です・ます」。`{name}` などの置換は名前も個数もそのまま保つ。
2. 迷うキーは、`sources/en.json` の `packages[名前空間]` で所属パッケージを特定する。`.dsh-cache/<版>/node_modules/@deepseek-ai/<パッケージ>/lib/` の下（多くは `client.js`）で、そのキーの使われ方と中国語（`zh`）の訳を確認する。
3. `previousEn` があるキーは英語の変化を読み、`currentJa` を直す必要があるかを判断する。直す必要がなければ `currentJa` をそのまま出力に含めてよい。
4. `olderEn` があるキーは、古い対応版ではその英語が表示される場所に同じ訳が出る。`en` と `olderEn` のどちらの意味にも合う言い回しにする（片方でしか正しくない説明文にしない）。置換の名前は全版で一致していなければ取り込めない。
5. 結果を `{ "名前空間": { "キー": "訳" } }` の形で `.dsh-cache/translations-<版>.json` に書き、取り込む。

```bash
pnpm apply .dsh-cache/translations-<版>.json
pnpm coverage --strict
```

意図的に英語のまま残すキーは `sources/accepted-fallbacks.json` に追加する（空白だけの区切り文字など）。

## 4. 版の更新と検証

```bash
pnpm add -D --save-exact @deepseek-ai/dsh-client-locale@<版>
```

- `peerDependencies["@deepseek-ai/dsh-client-locale"]` は範囲で書く（例：`>=0.2.0-rc.2 <0.3.0-0`）。DSH は prerelease も含めてこの範囲で判定し、範囲外の版ではプラグインを起動時に読み込まない。新しい版が範囲内なら peer は変えない。ただし新しい版が prerelease で、その `major.minor.patch`（例：`0.2.2-alpha.1` なら `0.2.2`）の条件がまだなければ `|| >=0.2.2-0 <0.2.3-0` を足す。npm・pnpm は prerelease を含めずに判定するため、足さないと npm で peer の衝突になる（テストが検出する）。次のマイナー版（`0.3.x`）に追従するときは上限を上げる。古い版の対応をやめるときは下限を上げ、`--drop-older` で sync する。
- テスト用の `dsh-client-locale-oldest`（npm エイリアス）は peer の下限の版にする。下限を上げたら `pnpm add -D dsh-client-locale-oldest@npm:@deepseek-ai/dsh-client-locale@<下限>` で揃える。
- 版を上げる。`package.json` の `version` のマイナー版を上げ（`0.1.0` → `0.2.0`）、`CHANGELOG.md` の先頭に `## v<新しい版>` の節を追加する。節には `対応 DSH:` の行と主な変更点を書く。
- 対応 DSH・検証した版・翻訳件数など版ごとの情報は `CHANGELOG.md` の該当節に記録する。CI がその節をタグに対応する GitHub リリースの説明に使う。README に具体的な版番号や対応表を重複させない。使い方が変わる場合だけ `README.md` と `README.ja.md` を更新する。
- タグは自分で付けない。PR のマージ後に CI が `v<版>` のタグとリリースを作成する。
- `pnpm check` を実行し、生成された `lib/` もコミットする（リポジトリから直接インストールされるため。CI が一致を検査する）。テストは最も新しい版と最も古い版の実際の `LocaleRuntime` で、登録・切替・解除を確認する。

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
