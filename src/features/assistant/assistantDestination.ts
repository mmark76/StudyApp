export const STUDYAPP_AI_ASSISTANT_URL =
  "https://chatgpt.com/g/g-6a6b687029608191af7b26717f0a2072-studyapp-ai-assistant";

export function getStudyAppAssistantUrl(
  configuredUrl = (import.meta.env as Record<string, string | undefined>)
    .VITE_STUDYAPP_AI_ASSISTANT_URL,
): string {
  const candidate = configuredUrl?.trim();
  if (!candidate) return STUDYAPP_AI_ASSISTANT_URL;

  try {
    const url = new URL(candidate);
    const isApproved =
      url.protocol === "https:" &&
      url.hostname === "chatgpt.com" &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.search === "" &&
      url.hash === "" &&
      url.href === STUDYAPP_AI_ASSISTANT_URL;

    return isApproved ? url.href : STUDYAPP_AI_ASSISTANT_URL;
  } catch {
    return STUDYAPP_AI_ASSISTANT_URL;
  }
}
