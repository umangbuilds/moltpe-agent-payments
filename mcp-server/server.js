// server.js — MCP Payment Server (Streamable HTTP)
// Reference implementation for AI agent payments via x402, MPP, and fiat rails.

const http = require('http');
const { loadTools } = require('./tools/index.js');
const { createRouter } = require('./provider-router.js');
const { createAuthMiddleware } = require('./middleware/auth.js');
const { createRateLimiter } = require('./middleware/rate-limit.js');

const PORT = parseInt(process.env.PORT || '3000', 10);
const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '60', 10);

function parseProviderFlag() {
  const flagIndex = process.argv.indexOf('--provider');
  if (flagIndex === -1 || flagIndex === process.argv.length - 1) return 'all';
  const value = process.argv[flagIndex + 1];
  const valid = ['stablecoin', 'session', 'fiat', 'all'];
  if (!valid.includes(value)) {
    console.error(`Invalid provider: ${value}. Valid: ${valid.join(', ')}`);
    process.exit(1);
  }
  return value;
}

function jsonRpcError(id, code, message, data) {
  return JSON.stringify({ jsonrpc: '2.0', id: id || null, error: { code, message, data } });
}

function jsonRpcResult(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const providerName = parseProviderFlag();
const router = createRouter(providerName);
const tools = loadTools();
const authMiddleware = createAuthMiddleware(AUTH_ENABLED);
const rateLimiter = createRateLimiter(RATE_LIMIT);

async function handleInitialize(id) {
  return jsonRpcResult(id, {
    protocolVersion: '2025-03-26',
    capabilities: { tools: {} },
    serverInfo: {
      name: 'moltpe-payments',
      version: '0.1.0',
      description: 'MCP payment tools for AI agents — x402, MPP, and fiat rails'
    }
  });
}

async function handleToolsList(id) {
  const toolList = tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema
  }));
  return jsonRpcResult(id, { tools: toolList });
}

async function handleToolsCall(id, params) {
  const { name, arguments: args } = params || {};
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return jsonRpcError(id, -32602, `Unknown tool: ${name}`);
  }
  try {
    const result = await tool.handler(args || {}, router);
    return jsonRpcResult(id, {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    });
  } catch (err) {
    return jsonRpcResult(id, {
      content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
      isError: true
    });
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', provider: providerName }));
    return;
  }

  // Rate limiting
  const rateLimitResult = rateLimiter(req);
  if (!rateLimitResult.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(null, -32000, 'Rate limit exceeded', { retryAfter: rateLimitResult.retryAfter }));
    return;
  }

  // Auth middleware
  const authResult = authMiddleware(req);
  if (!authResult.allowed) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(null, -32000, 'Unauthorized', { detail: authResult.reason }));
    return;
  }
  // Attach authenticated agent to request for tools to use
  req.authenticatedAgent = authResult.agentId || null;

  // Only accept POST on /
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(null, -32600, 'Method not allowed. Use POST.'));
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(null, -32700, 'Failed to read request body'));
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(null, -32700, 'Parse error: invalid JSON'));
    return;
  }

  if (!parsed.jsonrpc || parsed.jsonrpc !== '2.0' || !parsed.method) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(jsonRpcError(parsed.id, -32600, 'Invalid JSON-RPC 2.0 request'));
    return;
  }

  let response;
  try {
    switch (parsed.method) {
      case 'initialize':
        response = await handleInitialize(parsed.id);
        break;
      case 'tools/list':
        response = await handleToolsList(parsed.id);
        break;
      case 'tools/call':
        response = await handleToolsCall(parsed.id, parsed.params);
        break;
      default:
        response = jsonRpcError(parsed.id, -32601, `Method not found: ${parsed.method}`);
    }
  } catch (err) {
    response = jsonRpcError(parsed.id, -32603, 'Internal error', { detail: err.message });
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(response);
});

server.listen(PORT, () => {
  console.log(`MCP Payment Server running on port ${PORT} (provider: ${providerName})`);
});

module.exports = { server };
