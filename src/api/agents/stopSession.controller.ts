import type { Request, Response } from "express";
import { stopSession } from "../../core/services/agentOrchestrator.service";
import { findTradesBySessionId } from "../../core/db/trade.repo";

/**
 * POST /api/agents/:id/session/:sessionId/stop
 * Stop session: notify agent service, close Nitrolite, record settlement.
 */
export async function stopSessionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const sessionId = String(req.params.sessionId || "");
    if (!sessionId) {
      res.status(400).json({
        error: "missing_session_id",
        message: "sessionId parameter is required",
      });
      return;
    }
    const reason = (req.body.reason || "user_requested") as
      | "user_requested"
      | "timeout"
      | "risk_limit";

    const session = await stopSession(sessionId, reason);
    const trades = findTradesBySessionId(sessionId);
    const winningTrades = trades.filter((t) => (t.pnlUsd || 0) > 0).length;
    const winRate = trades.length > 0 ? winningTrades / trades.length : 0;

    res.json({
      sessionId: session.id,
      agentId: session.agentId,
      status: session.status,
      endedAt: session.endedAt?.toISOString() || null,
      finalPnlUsd: session.pnlUsd,
      summary: {
        numTrades: trades.length,
        winRate,
      },
      yellow: {
        settlementStatus: "settled",
        settlementTxHash: `0x${session.id.replace(/[^0-9a-f]/gi, "").padEnd(64, "0")}`, // Mocked for MVP
      },
    });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      res.status(404).json({
        error: "session_not_found",
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      error: "internal_error",
      message: error.message || "Failed to stop session",
    });
  }
}
