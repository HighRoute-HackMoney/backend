import express from "express";
import type { Request, Response } from "express";
import { ensureSafeForWallet, getSafeBalances } from "../../core/services/safe.service";
import { findUserByWallet } from "../../core/db/user.repo";
import { listAgents } from "../../api/agents/listAgents.controller";
import { getAgent } from "../../api/agents/getAgent.controller";
import { startSessionController } from "../../api/agents/startSession.controller";
import { getSessionStatusController } from "../../api/agents/getSessionStatus.controller";
import { stopSessionController } from "../../api/agents/stopSession.controller";
import { listSessions } from "../../api/sessions/listSessions.controller";

/**
 * Create and configure the main Express router for the backend API.
 */
export function createRouter() {
  const router = express.Router();

  // Health check
  router.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // User endpoints
  router.get("/me", (req: Request, res: Response) => {
    const walletAddress = String(req.header("x-wallet-address") ?? "").trim();
    if (!walletAddress) {
      return res.status(400).json({
        error: "missing-wallet-address",
        message: "x-wallet-address header is required",
      });
    }

    const user = findUserByWallet(walletAddress);
    if (!user) {
      return res.json({
        userId: walletAddress.toLowerCase(),
        walletAddress,
        safeAddress: null,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      userId: user.id,
      walletAddress: user.walletAddress,
      safeAddress: user.safeAddress,
      createdAt: user.createdAt.toISOString(),
    });
  });

  // Safe endpoints
  router.post("/safe/ensure", async (req: Request, res: Response) => {
    const walletAddress = String(req.header("x-wallet-address") ?? "").trim();
    if (!walletAddress) {
      return res.status(400).json({
        error: "missing-wallet-address",
        message: "x-wallet-address header is required",
      });
    }

    try {
      const result = await ensureSafeForWallet(walletAddress);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "safe-ensure-failed",
        message: (error as Error).message,
      });
    }
  });

  router.get("/safe/balance", async (req: Request, res: Response) => {
    const safeAddress = String(req.query.address ?? "").trim();
    if (!safeAddress) {
      return res.status(400).json({
        error: "missing-safe-address",
        message: "address query parameter is required",
      });
    }

    try {
      const result = await getSafeBalances(safeAddress);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "safe-balance-failed",
        message: (error as Error).message,
      });
    }
  });

  // Agent endpoints
  router.get("/agents", listAgents);
  router.get("/agents/:id", getAgent);
  router.post("/agents/:id/session/start", startSessionController);
  router.get("/agents/:id/session/:sessionId/status", getSessionStatusController);
  router.post("/agents/:id/session/:sessionId/stop", stopSessionController);

  // Session endpoints
  router.get("/sessions", listSessions);

  return router;
}

