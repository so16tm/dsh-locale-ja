// src/index.ts
var REPLY_LANGUAGE_SECTION = "so16tm-locale-ja:reply-language";
var REPLY_LANGUAGE_ORDER = 10150;
var LOCALE_SETTINGS_NAMESPACE = "locale";
var DEFAULT_LANGUAGE = "ja";
function selectedLanguage(settings) {
  try {
    const entry = settings?.describe().find((descriptor) => descriptor.ns === LOCALE_SETTINGS_NAMESPACE);
    const preference = entry?.value?.preference;
    return typeof preference === "string" && preference ? preference : void 0;
  } catch {
    return void 0;
  }
}
function replyInstruction(id) {
  let language = id;
  try {
    language = new Intl.DisplayNames(["en"], { type: "language" }).of(id) ?? id;
  } catch {
  }
  return [
    `Always write your messages to the user in ${language}: progress updates, plans, questions, explanations, and final summaries.`,
    `Keep replying in ${language} even when tool output, files, error messages, or earlier turns are in another language.`,
    "Use another language only when the user explicitly asks for it.",
    "Leave code, commands, file paths, identifiers, log excerpts, and quoted text in their original form."
  ].join(" ");
}
function apply(ctx, config) {
  if (config?.replyInUiLanguage === false) return;
  ctx.inject(["systemPrompt"], (ctx2) => {
    ctx2.systemPrompt.section({
      name: REPLY_LANGUAGE_SECTION,
      order: REPLY_LANGUAGE_ORDER,
      text: () => replyInstruction(selectedLanguage(ctx2.get("settings")) ?? DEFAULT_LANGUAGE),
      interpolate: false
    });
  });
}
export {
  REPLY_LANGUAGE_SECTION,
  apply,
  replyInstruction,
  selectedLanguage
};
