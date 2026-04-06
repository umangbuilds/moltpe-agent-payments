// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// middleware/auth.js — Bearer token authentication for the MCP server.
// Uses timing-safe comparison to prevent timing attacks on token validation.

const crypto = require('crypto');
const { AGENTS } = require('../providers/seed-data.js');

function createAuthMiddleware(enabled) {
  if (!enabled) {
    // Auth disabled — allow everything, no agent context
    return function noAuth() {
      return { allowed: true, agentId: null };
    };
  }

  // Build a token→agentId lookup from seed data
  const tokenMap = {};
  for (const [agentId, agent] of Object.entries(AGENTS)) {
    if (agent.token) {
      tokenMap[agent.token] = agentId;
    }
  }

  return function authMiddleware(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return { allowed: false, reason: 'Missing Authorization header' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return { allowed: false, reason: 'Invalid Authorization format. Use: Bearer <token>' };
    }

    const token = parts[1];

    // Check each known token with timing-safe comparison
    for (const [knownToken, agentId] of Object.entries(tokenMap)) {
      const tokenBuf = Buffer.from(token);
      const knownBuf = Buffer.from(knownToken);

      if (tokenBuf.length === knownBuf.length && crypto.timingSafeEqual(tokenBuf, knownBuf)) {
        return { allowed: true, agentId };
      }
    }

    return { allowed: false, reason: 'Invalid token' };
  };
}

module.exports = { createAuthMiddleware };
