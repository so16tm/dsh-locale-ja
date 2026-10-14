import type { LocaleService } from './types.js';
import { isJapaneseActive } from './locale.js';

const UI_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "BIZ UDPGothic", "Hiragino Sans", ' +
  '"Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';

const CODE_STACK =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, " +
  "'BIZ UDGothic', 'Yu Gothic UI', 'Meiryo', 'Noto Sans CJK JP', monospace";

// DSH 0.2.1+ keeps its built-in stacks in --dsh-font-family-*-default on :root, and on body
// puts the user's font from Settings ahead of them in --dsw-font-family / --ds-font-family-code.
// Replacing only the built-in stacks keeps that user choice. DSH 0.2.0 sets --dsw-font-family
// and --ds-font-family-code on :root alone, so they are replaced there as well; in 0.2.1+ the
// body declarations shadow these for every element below <html>.
const CSS =
  ':root {' +
  `--dsh-font-family-text-default: ${UI_STACK} !important;` +
  `--dsh-font-family-code-default: ${CODE_STACK} !important;` +
  `--dsw-font-family: ${UI_STACK} !important;` +
  `--ds-font-family-code: ${CODE_STACK} !important;` +
  `--dsw-font-family-brand: 'Montserrat', ${UI_STACK} !important;` +
  '}';

/** Own a style tag that exists only while Japanese is the active locale. */
export function installJapaneseFont(
  locale: Pick<LocaleService, 'getLocale' | 'subscribe'>,
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
): () => void {
  if (!doc) return () => {};
  const style = doc.createElement('style');
  style.dataset.plugin = '@so16tm/dsh-locale-ja';
  style.textContent = CSS;
  const sync = (): void => {
    if (isJapaneseActive(locale)) {
      if (!style.isConnected) doc.head.append(style);
    } else {
      style.remove();
    }
  };
  sync();
  const unsubscribe = locale.subscribe(sync);
  return () => {
    unsubscribe();
    style.remove();
  };
}
