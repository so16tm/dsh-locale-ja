<p align="center">
  <img src="docs/images/readme-header.webp" alt="dsh-locale-ja — Japanese UI for DeepSeek Harness" width="960" />
</p>

# dsh-locale-ja

[English](README.md) | [日本語](README.ja.md)

A Japanese language plugin for the DeepSeek Harness (DSH) Web UI.

## Features

- Translates the DSH Web UI into Japanese.
- Uses Japanese-friendly fallback fonts while respecting your font settings.
- Requests Japanese AI replies when Japanese is explicitly selected. You can still ask for another reply language.

## Compatibility

Use this plugin with DSH's Web UI. Choose a compatible tag from [GitHub Releases](https://github.com/so16tm/dsh-locale-ja/releases); supported DSH versions and changes are recorded there and in [CHANGELOG.md](CHANGELOG.md).

## Installation

Git and GitHub authentication with access to this private repository are required. Replace `<tag>` with your selected release tag. Prebuilt files are included; no local build is needed.

```sh
dsh plugin --profile web add 'git+https://github.com/so16tm/dsh-locale-ja.git#<tag>'
dsh web
```

These commands use the `web` profile. Omitting the tag installs `main`, which may contain unreleased changes.

To update, run the same `add` command with the new release tag and restart `dsh web`. It replaces the installed version; you do not need to remove it first.

To remove:

```sh
dsh plugin --profile web remove @so16tm/dsh-locale-ja
```

Restart DSH after removal.

## Usage

Choose **日本語** in **Settings → General → Language**. The reply-language instruction takes effect on the next reply.

The instruction requires an explicit Japanese selection saved on the DSH host. It is not added when the language is chosen automatically by the browser or the host cannot save the selection, such as when accessing DSH from another PC on the LAN. Explicit requests for another reply language take precedence.

## Configuration

To disable the reply-language instruction, add this entry to the profile's `cordis.patch.yml`:

```yaml
- id: so16tm-locale-ja
  config:
    replyInUiLanguage: false
```

## Limitations

- Remove any other Japanese language plugin before enabling this one.
- Newly introduced DSH strings may remain in English until translations are added.

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs type checking, the build, tests, translation coverage, and release-note validation.

Follow the [translation guide](docs/translation-guide.md) when editing translations. The [DSH update workflow](.claude/skills/dsh-update/SKILL.md) (Japanese) covers extracting source strings, applying translations, checking compatibility, and releasing. See [ARCHITECTURE.md](ARCHITECTURE.md) (Japanese) for design constraints.

Commit the generated `lib/` files with source or translation changes. Update both READMEs when usage changes; record release-specific information in CHANGELOG.md.

## License

[MIT](LICENSE). Referenced projects are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
