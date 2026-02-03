export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const RESERVED = [
  "admin",
  "administrator",
  "attendrix",
  "auth",
  "api",
  "dashboard",
  "help",
  "login",
  "logout",
  "me",
  "mod",
  "moderator",
  "null",
  "onboarding",
  "owner",
  "privacy",
  "profile",
  "root",
  "settings",
  "signin",
  "signup",
  "support",
  "system",
  "terms",
  "undefined",
  "user",
  "users",
];

const RESERVED_SET = new Set(RESERVED.map((item) => item.toLowerCase()));

export function normalizeUsername(input: string): string {
  return input.trim();
}

export function normalizeUsernameLower(input: string): string {
  return normalizeUsername(input).toLowerCase();
}

export function isUsernameValid(input: string): boolean {
  return USERNAME_REGEX.test(input);
}

export function isReservedUsername(input: string): boolean {
  return RESERVED_SET.has(normalizeUsernameLower(input));
}

export function getUsernameError(input: string): string | null {
  const trimmed = normalizeUsername(input);
  if (!trimmed) return "Username is required";
  if (!isUsernameValid(trimmed)) {
    return "Use 3-20 characters with letters, numbers, or underscores";
  }
  if (isReservedUsername(trimmed)) {
    return "This username is reserved";
  }
  return null;
}
