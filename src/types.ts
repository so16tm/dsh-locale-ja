import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';

/** Only the public language-pack surface; no private fields or preference interception. */
export type LocaleService = Pick<LocaleRuntime, 'register' | 'addLanguage' | 'getLocale' | 'subscribe'>;

/** Namespace -> key -> Japanese text, as stored in translations/ja.json. */
export type Dictionaries = Readonly<Record<string, Readonly<Record<string, string>>>>;
