import type { Request, Response } from "express";
import { getSessionStatus } from "../../core/services/agentOrchestrator.service";

/**
 * GET /api/agents/:id/session/:sessionId/status
 * Return session state, trades, and Yellow settlement status.
 */
export async function getSessionStatusController(
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
    const result = await getSessionStatus(sessionId);

    res.json({
      sessionId: result.session.id,
      agentId: result.session.agentId,
      status: result.session.status,
      safeAddress: result.session.safeAddress,
      startedAt: result.session.startedAt.toISOString(),
      endedAt: result.session.endedAt?.toISOString() || null,
      pnlUsd: result.session.pnlUsd,
      numTrades: result.trades.length,
      lastAction:
        result.trades.length > 0
          ? {
              timestamp: result.trades[result.trades.length - 1].openedAt,
              symbol: result.trades[result.trades.length - 1].symbol,
              side: result.trades[result.trades.length - 1].side,
              sizeUsd: result.trades[result.trades.length - 1].sizeUsd,
              entryPrice: result.trades[result.trades.length - 1].entryPrice,
            }
          : null,
      trades: result.trades,
      yellow: result.yellow,
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
      message: error.message || "Failed to get session status",
    });
  }
}
