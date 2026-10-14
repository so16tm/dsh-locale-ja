import type { Dictionaries, LocaleService } from './types.js';
export declare const JAPANESE = "ja";
export declare function isJapaneseActive(locale: Pick<LocaleService, 'getLocale'>): boolean;
/**
 * Register every dictionary, then the language itself, as one transaction.
 * A failure unwinds what was already registered; the returned disposer
 * releases everything in reverse order and is safe to call twice.
 */
export declare function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void;
