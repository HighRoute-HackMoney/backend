import type { Request, Response } from "express";
import { getAllAgents } from "../../core/db/agent.registry";
import { findSessionsByAgentId } from "../../core/db/session.repo";
import type { AgentWithReputation } from "../../core/models/agent.model";

/**
 * GET /api/agents
 * Return all available agents with basic reputation computed from historical sessions.
 */
export async function listAgents(req: Request, res: Response): Promise<void> {
  try {
    const agents = getAllAgents();
    const agentsWithReputation: AgentWithReputation[] = agents.map((agent) => {
      const sessions = findSessionsByAgentId(agent.id);
      const closedSessions = sessions.filter((s) => s.status === "closed");
      const totalSessions = closedSessions.length;
      const winningSessions = closedSessions.filter((s) => s.pnlUsd > 0).length;
      const winRate = totalSessions > 0 ? winningSessions / totalSessions : 0;
      const avgPnlUsd =
        totalSessions > 0
          ? closedSessions.reduce((sum, s) => sum + s.pnlUsd, 0) / totalSessions
          : 0;

      return {
        ...agent,
        reputation: {
          sessions: totalSessions,
          winRate,
          avgPnlUsd,
        },
      };
    });

    res.json(agentsWithReputation);
  } catch (error: any) {
    res.status(500).json({
      error: "internal_error",
      message: error.message || "Failed to list agents",
    });
  }
}
