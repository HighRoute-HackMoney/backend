import type { Request, Response } from "express";
import { findUserByWallet } from "../../core/db/user.repo";
import { findSessionsByUserId } from "../../core/db/session.repo";

/**
 * GET /api/sessions
 * List all past sessions for the current user.
 */
export async function listSessions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;

    if (!walletAddress) {
      res.status(400).json({
        error: "missing_wallet_address",
        message: "x-wallet-address header is required",
      });
      return;
    }

    const user = findUserByWallet(walletAddress);
    if (!user) {
      res.json([]);
      return;
    }

    const sessions = findSessionsByUserId(user.id);

    res.json(
      sessions.map((s) => ({
        sessionId: s.id,
        agentId: s.agentId,
        status: s.status,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() || null,
        pnlUsd: s.pnlUsd,
      }))
    );
  } catch (error: any) {
    res.status(500).json({
      error: "internal_error",
      message: error.message || "Failed to list sessions",
    });
  }
}
