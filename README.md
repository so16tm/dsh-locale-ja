<p align="center">
  <img src="docs/images/readme-header.webp" alt="dsh-locale-ja — Japanese UI for DeepSeek Harness" width="960" />
</p>

# dsh-locale-ja

[English](README.md) | [日本語](README.ja.md)

A Japanese language plugin for the DeepSeek Harness (DSH) Web UI, built on DSH's public language-pack API without changing the host application.

## Features

- Japanese translations for 2,762 of the 2,766 UI strings in DSH `0.2.1-alpha.2`. The remaining four strings are whitespace-only separators and retain their original English values.
- Retains translations for strings found only in `0.2.0-rc.2`.
- Requests Japanese AI replies while Japanese is explicitly selected in the UI. Users can still request another reply language.

## Compatibility

Use this plugin with the `web` profile. See [CHANGELOG.md](CHANGELOG.md) for release details.

| Plugin | Supported DSH |
| --- | --- |
| `v0.3.0` | `0.2.x` starting with `0.2.0-rc.2` (verified: `0.2.0-rc.2`, `0.2.1-alpha.2`) |
| `v0.2.0` | `0.2.x` starting with `0.2.0-rc.2` (verified: `0.2.0-rc.2`, `0.2.1-alpha.2`) |
| `v0.1.0` | `0.2.0-rc.2`, `0.2.1-alpha.2` |

From `v0.2.0`, the plugin also loads on unverified DSH versions within this `0.2.x` range. Strings introduced by those versions appear in English until a plugin update adds translations.

## Installation

Install a tag compatible with your DSH version. The repository includes prebuilt `lib/` files.

```sh
dsh plugin --profile web add 'git+https://github.com/so16tm/dsh-locale-ja.git#v0.3.0'
dsh web
```

This repository is private. Install Git and configure GitHub authentication for an account with access before installing from it.

You can also enter `git+https://github.com/so16tm/dsh-locale-ja.git#v0.3.0` in **Plugins → Add plugin**. Omitting the tag installs the latest `main`, which may contain unreleased changes.

To update, run the same `add` command with the new release tag and restart `dsh web`. It replaces the installed version; you do not need to remove it first.

To remove:

```sh
dsh plugin --profile web remove @so16tm/dsh-locale-ja
```

## Usage

Choose **日本語** in **Settings → General → Language**. DSH saves this selection in its settings.

While Japanese is explicitly selected, the plugin adds an instruction to the system prompt asking the AI to reply in Japanese. DSH's default prompt does not specify a reply language, so otherwise tool output or file contents can cause replies to switch to English or Chinese.

- Changing the selected language takes effect on the next reply.
- Selecting another language, or leaving language selection to the browser, adds no instruction.
- When DSH is opened from a non-loopback address (for example, another PC on the LAN), DSH does not save the language selection on the host, so the instruction is not added.
- Explicit requests from the user for another language take precedence.

## Configuration

To disable the reply-language instruction, add this entry to the profile's `cordis.patch.yml`:

```yaml
- id: so16tm-locale-ja
  config:
    replyInUiLanguage: false
```

## Limitations

Do not enable this plugin alongside another Japanese language plugin, such as `@fang2hou/dsh-locale-ja`. Remove the other plugin first.

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs type checking, the build, tests, translation coverage, and release-note validation.

### Tracking a new DSH release

In Claude Code, `/dsh-update <version>` runs the update workflow, including translation, compatibility checks, and PR creation. See the [skill](.claude/skills/dsh-update/SKILL.md). To perform the workflow manually:

```sh
pnpm sync 0.2.1-alpha.2
```

The argument accepts a version or dist-tag and defaults to `next`. The script downloads the specified DSH version from npm into `.dsh-cache/` with package scripts disabled, statically analyzes its distributed code, and writes the English source strings to `sources/en.json`. It reports added, changed, and removed strings and translation coverage. Keys requiring translation (missing translations or changed English) appear in the `todo` field of `.dsh-cache/sync-report.json`, together with their English source.

The previous version remains supported. Keys found only in that version, or whose English differs, are retained with their English text in `sources/older.json`; their translations are kept as well. Use wording that fits both English versions (see `olderEn` in `todo`). Use `--drop-older` only when dropping support for the previous version: it removes the previous English records and translations for keys absent from the new version.

Prepare translations as JSON in the form `{ "namespace": { "key": "translation" } }`, then apply them:

```sh
pnpm apply path/to/new-translations.json
pnpm coverage
```

Unknown keys and mismatched `{name}` placeholders are rejected. Use `pnpm coverage --strict` to fail when translations are missing.

### Releasing a version

Versions are managed by `version` in `package.json` and the `v<version>` Git tag.

1. In a PR, bump `version`, add a `## v<version>` section to [CHANGELOG.md](CHANGELOG.md) describing supported DSH versions and changes, and update the compatibility tables in both `README.md` and `README.ja.md`. `pnpm check` fails if the changelog section is missing.
2. Merging the PR into `main` lets CI automatically create the `v<version>` tag and a GitHub release.

Use a minor version bump for new DSH support or added/changed translations (`0.1.0` → `0.2.0`), and a patch bump for translation corrections (`0.1.0` → `0.1.1`).

See [ARCHITECTURE.md](ARCHITECTURE.md) for design contracts.

## License

[MIT](LICENSE). Referenced projects are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
