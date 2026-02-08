import type { Session, SessionStatus } from "../models/session.model";

/**
 * In-memory store for sessions (MVP only).
 * In production, replace with a real database.
 */
const sessions: Map<string, Session> = new Map();

/**
 * Create a new session record.
 */
export function createSession(session: Session): Session {
  sessions.set(session.id, { ...session });
  return session;
}

/**
 * Find a session by ID.
 */
export function findSessionById(sessionId: string): Session | null {
  return sessions.get(sessionId) || null;
}

/**
 * Update an existing session.
 */
export function updateSession(
  sessionId: string,
  updates: Partial<Session>
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const updated = { ...session, ...updates };
  sessions.set(sessionId, updated);
  return updated;
}

/**
 * Find all sessions for a given user.
 */
export function findSessionsByUserId(userId: string): Session[] {
  return Array.from(sessions.values()).filter((s) => s.userId === userId);
}

/**
 * Find all sessions for a given agent.
 */
export function findSessionsByAgentId(agentId: string): Session[] {
  return Array.from(sessions.values()).filter((s) => s.agentId === agentId);
}
