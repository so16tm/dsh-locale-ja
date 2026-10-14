import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-system-prompt';
import type { SettingsDescriptor } from '@deepseek-ai/dsh-settings';

/** Prompt section that keeps the agent's replies in the UI language. */
export const REPLY_LANGUAGE_SECTION = 'so16tm-locale-ja:reply-language';

// The default prompt names no reply language, so the model drifts toward whatever the
// tool output or its own bias favours. Sit just before the deployment persona suffix.
const REPLY_LANGUAGE_ORDER = 10150;

// dsh-client-locale keeps an explicit UI language choice in its own settings entry.
const LOCALE_SETTINGS_NAMESPACE = 'locale';

/** Used when the UI language is left to the browser, which the Host cannot see. */
const DEFAULT_LANGUAGE = 'ja';

export interface Config {
  /** Ask the agent to reply in the UI language chosen in Settings. Defaults to true. */
  replyInUiLanguage?: boolean;
}

type SettingsReader = { describe(): Pick<SettingsDescriptor, 'ns' | 'value'>[] };

/** The language id saved by Settings → General → Language, if one was chosen explicitly. */
export function selectedLanguage(settings: SettingsReader | undefined): string | undefined {
  try {
    const entry = settings?.describe().find((descriptor) => descriptor.ns === LOCALE_SETTINGS_NAMESPACE);
    const preference = (entry?.value as { preference?: unknown } | undefined)?.preference;
    return typeof preference === 'string' && preference ? preference : undefined;
  } catch {
    return undefined;
  }
}

/** English instruction naming the reply language, e.g. `ja` -> Japanese. */
export function replyInstruction(id: string): string {
  let language = id;
  try {
    language = new Intl.DisplayNames(['en'], { type: 'language' }).of(id) ?? id;
  } catch {}
  return [
    `Always write your messages to the user in ${language}: progress updates, plans, questions, explanations, and final summaries.`,
    `Keep replying in ${language} even when tool output, files, error messages, or earlier turns are in another language.`,
    'Use another language only when the user explicitly asks for it.',
    'Leave code, commands, file paths, identifiers, log excerpts, and quoted text in their original form.',
  ].join(' ');
}

/**
 * Host half. The client module is mounted through cordis.patch.yml; here the plugin only
 * adds the reply-language section once the prompt registry exists, so profiles without
 * one still load the language pack. The language is read on every prompt assembly, so a
 * change in Settings applies from the next model step.
 */
export function apply(ctx: Context, config: Config | undefined): void {
  if (config?.replyInUiLanguage === false) return;
  ctx.inject(['systemPrompt'], (ctx) => {
    ctx.systemPrompt.section({
      name: REPLY_LANGUAGE_SECTION,
      order: REPLY_LANGUAGE_ORDER,
      text: () => replyInstruction(selectedLanguage(ctx.get('settings')) ?? DEFAULT_LANGUAGE),
      interpolate: false,
    });
  });
}
