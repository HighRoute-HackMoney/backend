import type { Request, Response } from "express";
import { startSession } from "../../core/services/agentOrchestrator.service";

/**
 * POST /api/agents/:id/session/start
 * Create new session: open Nitrolite, persist Session, notify agent service.
 */
export async function startSessionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const agentId = String(req.params.id || "");
    if (!agentId) {
      res.status(400).json({
        error: "missing_agent_id",
        message: "agent id parameter is required",
      });
      return;
    }
    const walletAddress = req.headers["x-wallet-address"] as string;

    if (!walletAddress) {
      res.status(400).json({
        error: "missing_wallet_address",
        message: "x-wallet-address header is required",
      });
      return;
    }

    const { safeAddress, baseCollateralUsd, maxDurationSeconds, market } =
      req.body;

    if (!safeAddress) {
      res.status(400).json({
        error: "missing_safe_address",
        message: "safeAddress is required in request body",
      });
      return;
    }

    const session = await startSession({
      walletAddress,
      agentId,
      safeAddress,
      baseCollateralUsd: baseCollateralUsd || 50,
      maxDurationSeconds: maxDurationSeconds || 600,
      market,
    });

    res.json({
      sessionId: session.id,
      agentId: session.agentId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      nitroliteSessionId: session.nitroliteSessionId,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "internal_error",
      message: error.message || "Failed to start session",
    });
  }
}
