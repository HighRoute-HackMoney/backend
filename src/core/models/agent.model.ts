/**
 * Configuration for an OpenClaw trading agent.
 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  revenueWallet: string;
  riskProfile: {
    maxLeverage: number;
    maxPositionUsd: number;
    maxDailyLossUsd: number;
  };
  learningMode: "bandit-trend" | "bandit-mean-reversion" | string;
  markets: string[];
}

/**
 * Reputation metrics computed from historical sessions.
 */
export interface AgentReputation {
  sessions: number;
  winRate: number;
  avgPnlUsd: number;
}

/**
 * Agent with computed reputation for marketplace display.
 */
export interface AgentWithReputation extends AgentConfig {
  reputation: AgentReputation;
}
