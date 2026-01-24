export const EVENTS = {
  DOWNLOAD_APK: "download_apk_click",
  GITHUB_VISIT: "github_repo_visit",
  AUTH_SIGNIN: "user_signin",
  AUTH_SIGNUP: "user_signup",
  ONBOARDING_START: "onboarding_start",
  ONBOARDING_COMPLETE: "onboarding_complete",
} as const;

export const trackEvent = (
  eventName: string,
  data?: Record<string, string | number | boolean>,
) => {
  if (typeof window !== "undefined" && window.umami) {
    try {
      window.umami.track(eventName, data);
    } catch (error) {
      console.warn("Umami track error:", error);
    }
  }
};
