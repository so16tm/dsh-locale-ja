import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-system-prompt';
import type { SettingsDescriptor } from '@deepseek-ai/dsh-settings';

/** Prompt section that keeps the agent's replies in Japanese while Japanese is selected. */
export const REPLY_LANGUAGE_SECTION = 'so16tm-locale-ja:reply-language';

// The default prompt names no reply language, so the model drifts toward whatever the
// tool output or its own bias favours. Sit just before the deployment persona suffix.
const REPLY_LANGUAGE_ORDER = 10150;

// dsh-client-locale keeps an explicit UI language choice in its own settings entry.
const LOCALE_SETTINGS_NAMESPACE = 'locale';

export interface Config {
  /** Ask the agent to reply in Japanese while Japanese is chosen in Settings. Defaults to true. */
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

/** English instruction that keeps the agent's messages in Japanese. */
export const REPLY_INSTRUCTION = [
  'Always write your messages to the user in Japanese: progress updates, plans, questions, explanations, and final summaries.',
  'Keep replying in Japanese even when tool output, files, error messages, or earlier turns are in another language.',
  'Use another language only when the user explicitly asks for it.',
  'Leave code, commands, file paths, identifiers, log excerpts, and quoted text in their original form.',
].join(' ');

/** Whether Settings → General → Language holds an explicit Japanese choice. */
export function japaneseSelected(settings: SettingsReader | undefined): boolean {
  return selectedLanguage(settings)?.toLowerCase().split('-')[0] === 'ja';
}

/**
 * Host half. The client module is mounted through cordis.patch.yml; here the plugin only
 * adds the reply-language section once the prompt registry exists, so profiles without
 * one still load the language pack. The section speaks only for this pack's own language:
 * it is empty (and so absent) unless Japanese was chosen explicitly. A choice left to the
 * browser is invisible to the Host, and other languages keep DSH's default behavior.
 * The choice is read on every prompt assembly, so a change applies from the next model step.
 */
export function apply(ctx: Context, config: Config | undefined): void {
  if (config?.replyInUiLanguage === false) return;
  ctx.inject(['systemPrompt'], (ctx) => {
    ctx.systemPrompt.section({
      name: REPLY_LANGUAGE_SECTION,
      order: REPLY_LANGUAGE_ORDER,
      text: () => (japaneseSelected(ctx.get('settings')) ? REPLY_INSTRUCTION : ''),
      interpolate: false,
    });
  });
}
