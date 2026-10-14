// src/index.ts
var REPLY_LANGUAGE_SECTION = "so16tm-locale-ja:reply-language";
var REPLY_LANGUAGE_ORDER = 10150;
var LOCALE_SETTINGS_NAMESPACE = "locale";
function selectedLanguage(settings) {
  try {
    const entry = settings?.describe().find((descriptor) => descriptor.ns === LOCALE_SETTINGS_NAMESPACE);
    const preference = entry?.value?.preference;
    return typeof preference === "string" && preference ? preference : void 0;
  } catch {
    return void 0;
  }
}
var REPLY_INSTRUCTION = [
  "Always write your messages to the user in Japanese: progress updates, plans, questions, explanations, and final summaries.",
  "Keep replying in Japanese even when tool output, files, error messages, or earlier turns are in another language.",
  "Use another language only when the user explicitly asks for it.",
  "Leave code, commands, file paths, identifiers, log excerpts, and quoted text in their original form."
].join(" ");
function japaneseSelected(settings) {
  return selectedLanguage(settings)?.toLowerCase().split("-")[0] === "ja";
}
function apply(ctx, config) {
  if (config?.replyInUiLanguage === false) return;
  ctx.inject(["systemPrompt"], (ctx2) => {
    ctx2.systemPrompt.section({
      name: REPLY_LANGUAGE_SECTION,
      order: REPLY_LANGUAGE_ORDER,
      text: () => japaneseSelected(ctx2.get("settings")) ? REPLY_INSTRUCTION : "",
      interpolate: false
    });
  });
}
export {
  REPLY_INSTRUCTION,
  REPLY_LANGUAGE_SECTION,
  apply,
  japaneseSelected,
  selectedLanguage
};
