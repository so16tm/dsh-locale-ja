import type { Dictionaries, LocaleService } from './types.js';
export declare const JAPANESE = "ja";
export declare function isJapaneseActive(locale: Pick<LocaleService, 'getLocale'>): boolean;
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
export declare function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void;
