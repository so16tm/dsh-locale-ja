import type { Dictionaries, LocaleService } from './types.js';
export declare const JAPANESE = "ja";
export declare function isJapaneseActive(locale: Pick<LocaleService, 'getLocale'>): boolean;
/**
 * Register every dictionary, then the language itself, as one transaction.
 * A failure unwinds what was already registered; the returned disposer
 * releases everything in reverse order and is safe to call twice.
 *
 * DSH builds after 0.2.1-rc.3 ship their own Japanese language and the `ja` dictionaries
 * for a few namespaces. A namespace or language already held by DSH is left to its owner:
 * registering over it throws, which would keep this plugin from activating at all.
 */
export declare function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void;
