"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type OnboardingStep = "username" | "identity" | "courses" | "complete";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "reserved"
  | "error";

export type OnboardingState = {
  step: OnboardingStep;
  username: string;
  usernameStatus: UsernameStatus;
  batchID: string | null;
  semesterID: string | null;
  consentTerms: boolean;
  consentPromotions: boolean;
  labSelections: Record<string, string>;
  electiveSelections: Record<string, string>;
  skipElectives: boolean;
};

const initialState: OnboardingState = {
  step: "username",
  username: "",
  usernameStatus: "idle",
  batchID: null,
  semesterID: null,
  consentTerms: false,
  consentPromotions: false,
  labSelections: {},
  electiveSelections: {},
  skipElectives: false,
};

export type OnboardingAction =
  | { type: "SET_USERNAME"; value: string }
  | { type: "SET_USERNAME_STATUS"; value: UsernameStatus }
  | { type: "SET_BATCH"; batchID: string; semesterID: string | null }
  | { type: "SET_CONSENT_TERMS"; value: boolean }
  | { type: "SET_CONSENT_PROMOS"; value: boolean }
  | { type: "SET_LAB_SELECTION"; category: string; courseID: string }
  | { type: "SET_ELECTIVE_SELECTION"; category: string; courseID: string }
  | { type: "SET_SKIP_ELECTIVES"; value: boolean }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; step: OnboardingStep }
  | { type: "RESET" };

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "SET_USERNAME":
      return { ...state, username: action.value };
    case "SET_USERNAME_STATUS":
      return { ...state, usernameStatus: action.value };
    case "SET_BATCH":
      return {
        ...state,
        batchID: action.batchID,
        semesterID: action.semesterID,
      };
    case "SET_CONSENT_TERMS":
      return { ...state, consentTerms: action.value };
    case "SET_CONSENT_PROMOS":
      return { ...state, consentPromotions: action.value };
    case "SET_LAB_SELECTION":
      return {
        ...state,
        labSelections: {
          ...state.labSelections,
          [action.category]: action.courseID,
        },
      };
    case "SET_ELECTIVE_SELECTION":
      return {
        ...state,
        electiveSelections: {
          ...state.electiveSelections,
          [action.category]: action.courseID,
        },
      };
    case "SET_SKIP_ELECTIVES": {
      return {
        ...state,
        skipElectives: action.value,
        electiveSelections: action.value ? {} : state.electiveSelections,
      };
    }
    case "NEXT_STEP": {
      const order: OnboardingStep[] = [
        "username",
        "identity",
        "courses",
        "complete",
      ];
      const index = order.indexOf(state.step);
      const next = order[Math.min(order.length - 1, index + 1)];
      return { ...state, step: next };
    }
    case "PREV_STEP": {
      const order: OnboardingStep[] = [
        "username",
        "identity",
        "courses",
        "complete",
      ];
      const index = order.indexOf(state.step);
      const prev = order[Math.max(0, index - 1)];
      return { ...state, step: prev };
    }
    case "SET_STEP":
      return { ...state, step: action.step };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

type OnboardingContextValue = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
