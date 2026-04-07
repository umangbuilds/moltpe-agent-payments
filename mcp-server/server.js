// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// server.js — MCP Payment Server (Streamable HTTP)
// Reference implementation for AI agent payments via x402, MPP, and fiat rails.

const PACKAGE_META = { origin: 'moltpe-agent-payments', author: 'umangbuilds', first_published: '2026-04-06', license: 'Apache-2.0', home: 'https://github.com/umangbuilds/moltpe-agent-payments' };

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { loadTools } = require('./tools/index.js');
const { createRouter } = require('./provider-router.js');
const { createAuthMiddleware } = require('./middleware/auth.js');
const { createRateLimiter } = require('./middleware/rate-limit.js');

const PORT = parseInt(process.env.PORT || '3000', 10);
const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '60', 10);
const PROVIDER_MODE = process.env.PROVIDER_MODE || 'mock';
if (!['mock', 'live'].includes(PROVIDER_MODE)) {
  console.error(`Invalid PROVIDER_MODE: ${PROVIDER_MODE}. Valid: mock, live`);
  process.exit(1);
}
const MOLTPE_MCP_URL = process.env.MOLTPE_MCP_URL || 'https://moltpe.com/mcp';
const MOLTPE_AGENT_TOKEN = process.env.MOLTPE_AGENT_TOKEN || '';
if (PROVIDER_MODE === 'live' && !MOLTPE_AGENT_TOKEN) {
  console.error('PROVIDER_MODE=live requires MOLTPE_AGENT_TOKEN to be set. Exiting.');
  process.exit(1);
}

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
const DEMO_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
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

// Forward a tool call to the live MoltPe MCP server
async function forwardToLiveMcp(toolName, args) {
  const rpcBody = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args }
  });

  const url = new URL(MOLTPE_MCP_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(rpcBody),
      'Authorization': `Bearer ${MOLTPE_AGENT_TOKEN}`
    }
  };

  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const mcpReq = transport.request(options, (mcpRes) => {
      const chunks = [];
      mcpRes.on('data', chunk => chunks.push(chunk));
      mcpRes.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'MCP server error'));
          } else if (parsed.result && parsed.result.content) {
            // Extract text content from MCP response
            const textContent = parsed.result.content.find(c => c.type === 'text');
            if (textContent) {
              try { resolve(JSON.parse(textContent.text)); }
              catch { resolve({ raw: textContent.text }); }
            } else {
              resolve(parsed.result);
            }
          } else {
            resolve(parsed.result || parsed);
          }
        } catch {
          reject(new Error('Invalid response from MCP server'));
        }
      });
    });

    mcpReq.on('error', (err) => {
      reject(new Error(`Could not reach MCP server: ${err.message}`));
    });

    mcpReq.setTimeout(15000, () => {
      mcpReq.destroy();
      reject(new Error('MCP server request timed out'));
    });

    mcpReq.write(rpcBody);
    mcpReq.end();
  });
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

  // Demo UI
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DEMO_HTML);
    return;
  }

  // API: current provider mode
  if (req.method === 'GET' && req.url === '/api/mode') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ mode: PROVIDER_MODE }));
    return;
  }

  // API: list tools with provider compatibility
  if (req.method === 'GET' && req.url === '/api/tools') {
    const providerMap = {
      call_x402_endpoint: ['stablecoin'],
      create_payment_session: ['session'],
      get_session_status: ['session']
    };
    const toolList = tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      providers: providerMap[t.name] || ['stablecoin', 'session', 'fiat']
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(toolList));
    return;
  }

  // API: try a tool (for demo UI)
  if (req.method === 'POST' && req.url === '/api/try-tool') {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    const { tool: toolName, args = {}, provider: preferredProvider } = body;
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unknown tool: ${toolName}` }));
      return;
    }
    const enrichedArgs = preferredProvider ? { ...args, provider: preferredProvider } : args;

    // Live mode: forward tool call to MoltPe MCP server
    if (PROVIDER_MODE === 'live') {
      if (!MOLTPE_AGENT_TOKEN) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request: { tool: toolName, args: enrichedArgs },
          error: 'Set MOLTPE_AGENT_TOKEN env var to use live mode',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      try {
        const result = await forwardToLiveMcp(toolName, enrichedArgs);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request: { tool: toolName, args: enrichedArgs },
          response: result,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request: { tool: toolName, args: enrichedArgs },
          error: err.message,
          timestamp: new Date().toISOString()
        }));
      }
      return;
    }

    // Mock mode: use local providers
    try {
      const result = await tool.handler(enrichedArgs, router);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        request: { tool: toolName, args: enrichedArgs },
        response: result,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        request: { tool: toolName, args: enrichedArgs },
        error: err.message,
        timestamp: new Date().toISOString()
      }));
    }
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
  console.log(`MCP Payment Server running on port ${PORT} (provider: ${providerName}, mode: ${PROVIDER_MODE})`);
  if (PROVIDER_MODE === 'live') {
    console.log(`  Live mode: forwarding to ${MOLTPE_MCP_URL}`);
  }
});

module.exports = { server };
