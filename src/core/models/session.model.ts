/**
 * Allowed lifecycle states for an agent trading session.
 */
export type SessionStatus = "pending" | "running" | "closing" | "closed" | "error";

/**
 * Represents a single trading session between a user and an OpenClaw agent.
 */
export interface Session {
  /** Unique identifier for this session. */
  id: string;
  /** Identifier of the user who owns this session. */
  userId: string;
  /** Identifier of the agent executing trades for this session. */
  agentId: string;
  /** Safe smart account address used as the capital source. */
  safeAddress: string;
  /** Associated Nitrolite session identifier from Yellow SDK, if opened. */
  nitroliteSessionId: string | null;
  /** High-level lifecycle status of the session. */
  status: SessionStatus;
  /** Timestamp for when the session was started. */
  startedAt: Date;
  /** Timestamp for when the session finished or failed. */
  endedAt: Date | null;
  /** Aggregated profit and loss in USD for the whole session. */
  pnlUsd: number;
}

