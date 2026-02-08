import { randomUUID } from "crypto";
import { findUserByWallet } from "../db/user.repo";
import { getAgentById } from "../db/agent.registry";
import {
  createSession,
  findSessionById,
  updateSession,
  findSessionsByAgentId,
} from "../db/session.repo";
import { findTradesBySessionId } from "../db/trade.repo";
import type { Session, SessionStatus } from "../models/session.model";
import { openNitroliteSession, closeNitroliteSession } from "./yellow.service";
import { recordSessionSettlement } from "./contractSettlement.service";
import axios from "axios";
import { loadConfig } from "../config/env";

const config = loadConfig();

/**
 * Parameters for starting a new agent trading session.
 */
export interface StartSessionParams {
  walletAddress: string;
  agentId: string;
  safeAddress: string;
  baseCollateralUsd: number;
  maxDurationSeconds?: number;
  market?: string;
}

/**
 * Start a new agent trading session for given user and agent.
 * - Ensures user & safe exist
 * - Opens Nitrolite session
 * - Persists Session in DB
 * - Notifies openclaw-agent service to start its trading loop
 */
export async function startSession(
  params: StartSessionParams
): Promise<Session> {
  // Validate user exists
  const user = findUserByWallet(params.walletAddress);
  if (!user) {
    throw new Error(`User not found for wallet: ${params.walletAddress}`);
  }

  // Validate agent exists
  const agent = getAgentById(params.agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${params.agentId}`);
  }

  // Open Nitrolite session
  const nitroliteSession = await openNitroliteSession({
    safeAddress: params.safeAddress,
    agentRevenueWallet: agent.revenueWallet,
  });

  // Create session record
  const session: Session = {
    id: `sess_${randomUUID()}`,
    userId: user.id,
    agentId: params.agentId,
    safeAddress: params.safeAddress,
    nitroliteSessionId: nitroliteSession.id,
    status: "pending",
    startedAt: new Date(),
    endedAt: null,
    pnlUsd: 0,
  };

  createSession(session);

  // Notify agent service to start trading loop
  try {
    await axios.post(`${config.agentServiceBaseUrl}/internal/sessions/start`, {
      sessionId: session.id,
      agentId: params.agentId,
      userAddress: params.walletAddress,
      safeAddress: params.safeAddress,
      market: params.market || agent.markets[0],
      baseCollateralUsd: params.baseCollateralUsd,
      maxDurationSeconds: params.maxDurationSeconds || 600,
    });

    // Update session status to running
    updateSession(session.id, { status: "running" });
    session.status = "running";
  } catch (error: any) {
    console.error(`Failed to start agent service session: ${error.message}`);
    // Still return the session, but mark it as error if agent service fails
    updateSession(session.id, { status: "error" });
    session.status = "error";
  }

  return session;
}

/**
 * Fetch current session status, including PnL and trades.
 * This aggregates DB (Session, Trade) plus optional live info from agent service.
 */
export async function getSessionStatus(sessionId: string): Promise<{
  session: Session;
  trades: any[];
  yellow: { nitroliteSessionId: string | null; settlementStatus: string };
}> {
  const session = findSessionById(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const trades = findTradesBySessionId(sessionId);

  // Optionally fetch live status from agent service
  let livePnl = session.pnlUsd;
  try {
    const response = await axios.get(
      `${config.agentServiceBaseUrl}/internal/sessions/${sessionId}/status`
    );
    if (response.data.pnlUsd !== undefined) {
      livePnl = response.data.pnlUsd;
      // Update session PnL if it changed
      if (livePnl !== session.pnlUsd) {
        updateSession(sessionId, { pnlUsd: livePnl });
      }
    }
  } catch (error: any) {
    // Agent service might not be available, use DB values
    console.warn(`Could not fetch live session status: ${error.message}`);
  }

  const sessionWithUpdatedPnl = { ...session, pnlUsd: livePnl };

  return {
    session: sessionWithUpdatedPnl,
    trades: trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      sizeUsd: t.sizeUsd,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      pnlUsd: t.pnlUsd,
      openedAt: t.openedAt.toISOString(),
      closedAt: t.closedAt?.toISOString() || null,
    })),
    yellow: {
      nitroliteSessionId: session.nitroliteSessionId,
      settlementStatus:
        session.status === "closed" ? "settled" : "in_progress",
    },
  };
}

/**
 * Stop an existing agent trading session.
 * - Notifies agent service to stop
 * - Closes Nitrolite session
 * - Records settlement on-chain
 * - Updates DB with final PnL and status
 */
export async function stopSession(
  sessionId: string,
  reason: "user_requested" | "timeout" | "risk_limit" = "user_requested"
): Promise<Session> {
  const session = findSessionById(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (session.status === "closed") {
    return session; // Already closed
  }

  // Update status to closing
  updateSession(sessionId, { status: "closing" });

  // Notify agent service to stop
  try {
    await axios.post(
      `${config.agentServiceBaseUrl}/internal/sessions/${sessionId}/stop`,
      { reason }
    );
  } catch (error: any) {
    console.warn(`Agent service stop call failed: ${error.message}`);
  }

  // Get final PnL from agent service or use current DB value
  let finalPnl = session.pnlUsd;
  try {
    const response = await axios.get(
      `${config.agentServiceBaseUrl}/internal/sessions/${sessionId}/status`
    );
    if (response.data.pnlUsd !== undefined) {
      finalPnl = response.data.pnlUsd;
    }
  } catch (error: any) {
    console.warn(`Could not fetch final PnL: ${error.message}`);
  }

  // Close Nitrolite session
  if (session.nitroliteSessionId) {
    try {
      await closeNitroliteSession(session.nitroliteSessionId);
    } catch (error: any) {
      console.warn(`Failed to close Nitrolite session: ${error.message}`);
    }
  }

  // Record settlement on-chain
  const user = findUserByWallet(session.safeAddress); // Simplified: using safeAddress as user identifier
  if (user) {
    try {
      await recordSessionSettlement({
        sessionId: session.id,
        userAddress: user.walletAddress,
        agentId: session.agentId,
        pnlUsd: finalPnl,
        nitroliteSessionId: session.nitroliteSessionId || "",
      });
    } catch (error: any) {
      console.warn(`Failed to record settlement on-chain: ${error.message}`);
    }
  }

  // Update session to closed
  const updated = updateSession(sessionId, {
    status: "closed",
    endedAt: new Date(),
    pnlUsd: finalPnl,
  });

  return updated || session;
}
