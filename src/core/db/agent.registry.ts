import type { AgentConfig } from "../models/agent.model";

/**
 * Static registry of available OpenClaw agents.
 * In production, this could be loaded from a database or external config.
 */
const AGENTS: AgentConfig[] = [
  {
    id: "trend-bandit-v1",
    name: "Trend Bandit v1",
    description:
      "Momentum-based futures agent using contextual bandit exploration. Analyzes recent price trends and volatility to make LONG/SHORT decisions on BTC perp.",
    revenueWallet: "0x0000000000000000000000000000000000000001", // TODO: replace with real agent wallet
    riskProfile: {
      maxLeverage: 5,
      maxPositionUsd: 100,
      maxDailyLossUsd: 50,
    },
    learningMode: "bandit-trend",
    markets: ["BTCUSDT_PERP"],
  },
  {
    id: "mean-reversion-v1",
    name: "Mean Reversion v1",
    description:
      "Mean reversion strategy agent that identifies overextended price moves and trades against the trend. Uses bandit learning to optimize entry/exit timing.",
    revenueWallet: "0x0000000000000000000000000000000000000002", // TODO: replace with real agent wallet
    riskProfile: {
      maxLeverage: 3,
      maxPositionUsd: 75,
      maxDailyLossUsd: 30,
    },
    learningMode: "bandit-mean-reversion",
    markets: ["BTCUSDT_PERP", "ETHUSDT_PERP"],
  },
];

/**
 * Get all available agents from the registry.
 */
export function getAllAgents(): AgentConfig[] {
  return AGENTS;
}

/**
 * Find an agent by ID.
 */
export function getAgentById(id: string): AgentConfig | null {
  return AGENTS.find((a) => a.id === id) || null;
}
