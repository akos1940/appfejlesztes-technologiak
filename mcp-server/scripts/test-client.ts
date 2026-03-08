import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const mcpUrl = new URL(process.env.MCP_URL ?? 'http://localhost:5190/mcp');

const transport = new StreamableHTTPClientTransport(mcpUrl);
const client = new Client({ name: 'todo-mcp-test-client', version: '1.0.0' });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  console.log('Tools:', tools.tools.map(t => t.name).join(', '));

  const result = await client.callTool({
    name: 'todos_list',
    arguments: { page: 1, pageSize: 5 }
  });

  console.log('todos_list result:');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await transport.terminateSession().catch(() => undefined);
  await client.close().catch(() => undefined);
}
