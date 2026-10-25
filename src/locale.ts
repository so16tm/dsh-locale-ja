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
 * DSH builds after 0.2.1-rc.3 ship their own Japanese: the `ja` language is defined before
 * the locale service is provided, and each DSH package registers its own `ja` dictionary
 * as it activates, including packages loaded later. Registering a (namespace, `ja`) slot
 * that a package claims afterwards makes that package fail to activate, and no ordering
 * of this pack can rule that out. So when the language already exists, DSH owns Japanese
 * and nothing is registered here.
 */
export function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void {
  if (hasLanguage(locale)) return () => {};
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
        // The slot is left to its owner.
      }
    }
    // Add the language last so a saved `ja` preference activates complete dictionaries.
    disposers.push(locale.addLanguage({ id: JAPANESE, label: '日本語', fallback: 'en' }));
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
