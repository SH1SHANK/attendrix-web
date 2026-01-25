export type ChallengeType = "weekly" | "monthly" | "semester";

export interface ChallengeTemplate {
  challengeID: string;
  challengeName: string;
  challengeDescription: string;
  challengeCondition: string;
  challengeType: ChallengeType;
  targetValue: number;
  amplixReward: number;
  isActive: boolean;
}

export interface ChallengeProgress {
  progressID: string;
  challengeID: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  idempotentKey: string;
}

export interface UserChallenge extends ChallengeTemplate {
  progressID?: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  idempotentKey?: string;
}
