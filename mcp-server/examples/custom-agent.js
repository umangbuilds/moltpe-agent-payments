// custom-agent.js — Example: programmatic tool calling against the MCP server.
// Run: node custom-agent.js
// Requires: MCP server running on port 3000

const http = require('http');

function callMcp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      });
    });

    req.on('error', reject);
    req.end(body);
  });
}

async function main() {
  console.log('--- Initialize ---');
  const init = await callMcp('initialize');
  console.log('Server:', init.serverInfo.name, init.serverInfo.version);

  console.log('\n--- List Tools ---');
  const { tools } = await callMcp('tools/list');
  console.log(`Available tools: ${tools.length}`);
  tools.forEach(t => console.log(`  - ${t.name}: ${t.description.slice(0, 60)}...`));

  console.log('\n--- Check Balance (agent-alice) ---');
  const balance = await callMcp('tools/call', {
    name: 'check_balance',
    arguments: { agentId: 'agent-alice' }
  });
  console.log(balance.content[0].text);

  console.log('\n--- Create Invoice ---');
  const invoice = await callMcp('tools/call', {
    name: 'create_invoice',
    arguments: {
      createdBy: 'agent-bob',
      billedTo: 'agent-alice',
      amount: 5,
      currency: 'USDC',
      description: 'API usage fee — April 2026'
    }
  });
  console.log(invoice.content[0].text);

  console.log('\n--- Done ---');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
