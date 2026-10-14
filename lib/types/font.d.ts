import type { LocaleService } from './types.js';
/** Own a style tag that exists only while Japanese is the active locale. */
export declare function installJapaneseFont(locale: Pick<LocaleService, 'getLocale' | 'subscribe'>, doc?: Document | undefined): () => void;
