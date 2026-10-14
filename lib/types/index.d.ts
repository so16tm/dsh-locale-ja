import type { Context } from '@deepseek-ai/cordis';
import type { SettingsDescriptor } from '@deepseek-ai/dsh-settings';
/** Prompt section that keeps the agent's replies in Japanese while Japanese is selected. */
export declare const REPLY_LANGUAGE_SECTION = "so16tm-locale-ja:reply-language";
export interface Config {
    /** Ask the agent to reply in Japanese while Japanese is chosen in Settings. Defaults to true. */
    replyInUiLanguage?: boolean;
}
type SettingsReader = {
    describe(): Pick<SettingsDescriptor, 'ns' | 'value'>[];
};
/** The language id saved by Settings → General → Language, if one was chosen explicitly. */
export declare function selectedLanguage(settings: SettingsReader | undefined): string | undefined;
/** English instruction that keeps the agent's messages in Japanese. */
export declare const REPLY_INSTRUCTION: string;
/** Whether Settings → General → Language holds an explicit Japanese choice. */
export declare function japaneseSelected(settings: SettingsReader | undefined): boolean;
/**
 * Host half. The client module is mounted through cordis.patch.yml; here the plugin only
 * adds the reply-language section once the prompt registry exists, so profiles without
 * one still load the language pack. The section speaks only for this pack's own language:
 * it is empty (and so absent) unless Japanese was chosen explicitly. A choice left to the
 * browser is invisible to the Host, and other languages keep DSH's default behavior.
 * The choice is read on every prompt assembly, so a change applies from the next model step.
 */
export declare function apply(ctx: Context, config: Config | undefined): void;
export {};
