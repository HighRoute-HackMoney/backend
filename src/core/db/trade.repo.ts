import type { Trade } from "../models/trade.model";

/**
 * In-memory store for trades (MVP only).
 * In production, replace with a real database.
 */
const trades: Map<string, Trade> = new Map();

/**
 * Create a new trade record.
 */
export function createTrade(trade: Trade): Trade {
  trades.set(trade.id, { ...trade });
  return trade;
}

/**
 * Find all trades for a given session.
 */
export function findTradesBySessionId(sessionId: string): Trade[] {
  return Array.from(trades.values())
    .filter((t) => t.sessionId === sessionId)
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
}

/**
 * Update an existing trade (e.g., to set exit price and PnL).
 */
export function updateTrade(
  tradeId: string,
  updates: Partial<Trade>
): Trade | null {
  const trade = trades.get(tradeId);
  if (!trade) return null;

  const updated = { ...trade, ...updates };
  trades.set(tradeId, updated);
  return updated;
}
