import type { Context } from '@deepseek-ai/cordis';
import type { SettingsDescriptor } from '@deepseek-ai/dsh-settings';
/** Prompt section that keeps the agent's replies in the UI language. */
export declare const REPLY_LANGUAGE_SECTION = "so16tm-locale-ja:reply-language";
export interface Config {
    /** Ask the agent to reply in the UI language chosen in Settings. Defaults to true. */
    replyInUiLanguage?: boolean;
}
type SettingsReader = {
    describe(): Pick<SettingsDescriptor, 'ns' | 'value'>[];
};
/** The language id saved by Settings → General → Language, if one was chosen explicitly. */
export declare function selectedLanguage(settings: SettingsReader | undefined): string | undefined;
/** English instruction naming the reply language, e.g. `ja` -> Japanese. */
export declare function replyInstruction(id: string): string;
/**
 * Host half. The client module is mounted through cordis.patch.yml; here the plugin only
 * adds the reply-language section once the prompt registry exists, so profiles without
 * one still load the language pack. The language is read on every prompt assembly, so a
 * change in Settings applies from the next model step.
 */
export declare function apply(ctx: Context, config: Config | undefined): void;
export {};
