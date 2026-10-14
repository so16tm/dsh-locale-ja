import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import translations from '../translations/ja.json' with { type: 'json' };
import { installJapaneseFont } from './font.js';
import { registerJapanese } from './locale.js';

export const inject = ['locale'];

export function apply(ctx: Context): void {
  ctx.effect(() => registerJapanese(ctx.locale, translations), 'locale-ja: dictionaries and language');
  ctx.effect(() => installJapaneseFont(ctx.locale), 'locale-ja: japanese font');
}
