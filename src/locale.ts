import type { Dictionaries, LocaleService } from './types.js';

export const JAPANESE = 'ja';

export function isJapaneseActive(locale: Pick<LocaleService, 'getLocale'>): boolean {
  return locale.getLocale().active.toLowerCase().split('-')[0] === JAPANESE;
}

function hasLanguage(locale: Pick<LocaleService, 'getLocale'>): boolean {
  return locale.getLocale().locales.some((language) => language.id.toLowerCase() === JAPANESE);
}

/**
 * Register every dictionary, then the language itself, as one transaction.
 * A failure unwinds what was already registered; the returned disposer
 * releases everything in reverse order and is safe to call twice.
 *
 * DSH builds after 0.2.1-rc.3 ship their own Japanese language and the `ja` dictionaries
 * for a few namespaces. A namespace or language already held by DSH is left to its owner:
 * registering over it throws, which would keep this plugin from activating at all.
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
      if (Object.keys(filled).length === 0) continue;
      try {
        disposers.push(locale.register(namespace, JAPANESE, filled));
      } catch {
        // `ja` is a valid tag, so the only way to fail is an occupied (namespace, ja) slot.
      }
    }
    // Add the language last so a saved `ja` preference activates complete dictionaries.
    if (!hasLanguage(locale)) disposers.push(locale.addLanguage({ id: JAPANESE, label: '日本語', fallback: 'en' }));
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
