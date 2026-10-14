import type { LocaleService } from './types.js';
import { isJapaneseActive } from './locale.js';

const UI_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "BIZ UDPGothic", "Hiragino Sans", ' +
  '"Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';

const CODE_STACK =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, " +
  "'BIZ UDGothic', 'Yu Gothic UI', 'Meiryo', 'Noto Sans CJK JP', monospace";

// :where() keeps specificity at zero so a user's own font plugin still wins,
// while covering body-level theme tokens that would defeat :root inheritance.
const CSS =
  ':where(:root, body) {' +
  `--dsw-font-family: ${UI_STACK} !important;` +
  "--dsw-font-family-brand: 'Montserrat', var(--dsw-font-family) !important;" +
  `--ds-font-family-code: ${CODE_STACK} !important;` +
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
