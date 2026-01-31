/**
 * Authentication State Machine
 *
 * Defines the possible states during the authentication flow:
 * - idle: Form ready for input
 * - authenticating: Firebase authentication in progress
 * - authenticated: Auth successful, creating server session
 * - redirecting: Session created, navigation in progress
 * - error: Authentication failed
 */

export type AuthStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "redirecting"
  | "error";

export interface AuthStateData {
  status: AuthStatus;
  message?: string;
  error?: string;
}

/**
 * Status messages displayed during authentication
 */
export const AUTH_MESSAGES: Record<AuthStatus, string> = {
  idle: "",
  authenticating: "Signing you in...",
  authenticated: "Verifying session...",
  redirecting: "Redirecting...",
  error: "Something went wrong",
};

/**
 * Creates the initial idle state
 */
export function createIdleState(): AuthStateData {
  return { status: "idle" };
}

/**
 * Creates an authenticating state with optional message
 */
export function createAuthenticatingState(message?: string): AuthStateData {
  return {
    status: "authenticating",
    message: message || AUTH_MESSAGES.authenticating,
  };
}

/**
 * Creates an authenticated state (session being created)
 */
export function createAuthenticatedState(): AuthStateData {
  return {
    status: "authenticated",
    message: AUTH_MESSAGES.authenticated,
  };
}

/**
 * Creates a redirecting state
 */
export function createRedirectingState(): AuthStateData {
  return {
    status: "redirecting",
    message: AUTH_MESSAGES.redirecting,
  };
}

/**
 * Creates an error state with message
 */
export function createErrorState(error: string): AuthStateData {
  return {
    status: "error",
    error,
  };
}

/**
 * Checks if the current state should show the loading screen
 */
export function isLoadingState(state?: AuthStateData): boolean {
  if (!state) return false;
  return (
    state.status === "authenticating" ||
    state.status === "authenticated" ||
    state.status === "redirecting"
  );
}

/**
 * Checks if form inputs should be disabled
 */
export function isFormDisabled(state?: AuthStateData): boolean {
  if (!state) return false;
  return state.status !== "idle" && state.status !== "error";
}
