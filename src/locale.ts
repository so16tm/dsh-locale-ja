import type { Dictionaries, LocaleService } from './types.js';

export const JAPANESE = 'ja';

export function isJapaneseActive(locale: Pick<LocaleService, 'getLocale'>): boolean {
  return locale.getLocale().active.toLowerCase().split('-')[0] === JAPANESE;
}

/**
 * Register every dictionary, then the language itself, as one transaction.
 * A failure unwinds what was already registered; the returned disposer
 * releases everything in reverse order and is safe to call twice.
 */
export function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void {
  const disposers: (() => void)[] = [];
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    for (const release of disposers.reverse()) release();
  };
  try {
    for (const [namespace, dictionary] of Object.entries(dictionaries)) {
      // Empty values fall back to English instead of rendering blank text.
      const filled = Object.fromEntries(
        Object.entries(dictionary).filter(([, value]) => typeof value === 'string' && value.trim() !== ''),
      );
      if (Object.keys(filled).length > 0) disposers.push(locale.register(namespace, JAPANESE, filled));
    }
    // Add the language last so a saved `ja` preference activates complete dictionaries.
    disposers.push(locale.addLanguage({ id: JAPANESE, label: '日本語', fallback: 'en' }));
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
