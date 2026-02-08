import type { Request, Response } from "express";
import { getAgentById } from "../../core/db/agent.registry";
import { findSessionsByAgentId } from "../../core/db/session.repo";
import type { AgentWithReputation } from "../../core/models/agent.model";

/**
 * GET /api/agents/:id
 * Return detailed agent info and recent session stats.
 */
export async function getAgent(req: Request, res: Response): Promise<void> {
  try {
    const agentId = String(req.params.id || "");
    const agent = getAgentById(agentId);

    if (!agent || !agentId) {
      res.status(404).json({
        error: "agent_not_found",
        message: `Agent with id ${agentId} not found`,
      });
      return;
    }

    const sessions = findSessionsByAgentId(agentId);
    const closedSessions = sessions.filter((s) => s.status === "closed");
    const totalSessions = closedSessions.length;
    const winningSessions = closedSessions.filter((s) => s.pnlUsd > 0).length;
    const winRate = totalSessions > 0 ? winningSessions / totalSessions : 0;
    const avgPnlUsd =
      totalSessions > 0
        ? closedSessions.reduce((sum, s) => sum + s.pnlUsd, 0) / totalSessions
        : 0;

    const lastSessions = closedSessions
      .sort((a, b) => (b.endedAt?.getTime() || 0) - (a.endedAt?.getTime() || 0))
      .slice(0, 10)
      .map((s) => ({
        sessionId: s.id,
        pnlUsd: s.pnlUsd,
      }));

    const agentWithReputation: AgentWithReputation & {
      lastSessions: { sessionId: string; pnlUsd: number }[];
    } = {
      ...agent,
      reputation: {
        sessions: totalSessions,
        winRate,
        avgPnlUsd,
      },
      lastSessions,
    };

    res.json(agentWithReputation);
  } catch (error: any) {
    res.status(500).json({
      error: "internal_error",
      message: error.message || "Failed to get agent",
    });
  }
}
