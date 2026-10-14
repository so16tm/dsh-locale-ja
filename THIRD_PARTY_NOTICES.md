# Third-party notices

以下はいずれも MIT ライセンスのプロジェクトです。ライセンス本文は本リポジトリの LICENSE と同文で、著作権者だけが異なります。

## コードと設計

- [heavyfox/dsh-locale-ja-next](https://github.com/heavyfox/dsh-locale-ja-next) — Copyright (c) 2026 dsh-locale-ja-next contributors。トランザクション型の登録・解除の構成、テスト方式、英語原文の静的抽出器（`scripts/lib/static-data.mjs`・`extract.mjs`）。
- [fang2hou/dsh-locale-ja](https://github.com/fang2hou/dsh-locale-ja) と fork の [yuu1111/dsh-locale-ja](https://github.com/yuu1111/dsh-locale-ja) — Copyright (c) 2026 fang2hou。公開 language-pack API のみを使う設計方針、優先度ゼロの日本語フォント上書き、翻訳ガイド（`docs/translation-guide.md`）。

## 翻訳データ（`translations/ja.json`）

DSH 0.2.0-rc.2 時点の次の5実装の訳を、キーごとに支持数で選んで統合しました（同数の場合は上から順に優先）。選ばれなかった候補は `sources/merge-candidates.json` に残しています。

1. [yuu1111/dsh-locale-ja](https://github.com/yuu1111/dsh-locale-ja)（2026-10-14 時点）— Copyright (c) 2026 fang2hou
2. [heavyfox/dsh-locale-ja-next](https://github.com/heavyfox/dsh-locale-ja-next) 0.1.1 — Copyright (c) 2026 dsh-locale-ja-next contributors
3. [BAILUO2153/dsh-locale-ja](https://github.com/BAILUO2153/dsh-locale-ja) 0.3.1 — Copyright (c) 2026 fang2hou
4. [akaitigo/deepseek-harness-ja](https://github.com/akaitigo/deepseek-harness-ja) 0.1.0 — Copyright (c) 2026 akaitigo
5. [fang2hou/dsh-locale-ja](https://github.com/fang2hou/dsh-locale-ja) 0.3.0 — Copyright (c) 2026 fang2hou
