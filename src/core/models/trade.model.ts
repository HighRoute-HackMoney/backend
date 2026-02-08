/**
 * Side of a futures trade.
 */
export type TradeSide = "LONG" | "SHORT";

/**
 * Represents a single trade executed within a trading session.
 */
export interface Trade {
  /** Unique identifier for this trade. */
  id: string;
  /** Identifier of the session this trade belongs to. */
  sessionId: string;
  /** Symbol of the futures contract, for example BTCUSDT_PERP. */
  symbol: string;
  /** Direction of the position (long or short). */
  side: TradeSide;
  /** Notional position size in USD. */
  sizeUsd: number;
  /** Entry price at which the position was opened. */
  entryPrice: number;
  /** Exit price at which the position was closed, if closed. */
  exitPrice: number | null;
  /** Time when the position was opened. */
  openedAt: Date;
  /** Time when the position was closed, if closed. */
  closedAt: Date | null;
  /** Profit or loss contribution in USD, if closed. */
  pnlUsd: number | null;
}

