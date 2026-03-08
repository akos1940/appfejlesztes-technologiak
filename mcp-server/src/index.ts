import cors from 'cors';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';

type Session = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
};

function parseAllowedHosts(value: string | undefined): string[] {
  const raw = (value ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return raw.length > 0 ? raw : ['localhost', '127.0.0.1'];
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function createTodoMcpServer(): McpServer {
  const backendBaseUrl = stripTrailingSlash(
    process.env.BACKEND_BASE_URL ?? 'http://localhost:5187'
  );

  const server = new McpServer({ name: 'todo-mcp-server', version: '1.0.0' });

  async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
    const resp = await fetch(input, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {})
      }
    });

    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${bodyText}`);
    }

    const text = await resp.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  server.registerTool(
    'todos_list',
    {
      title: 'Feladatok listázása',
      description: 'Feladatok lekérése a backend gateway-n keresztül (lapozva).',
      inputSchema: {
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10)
      }
    },
    async ({ page, pageSize }): Promise<CallToolResult> => {
      try {
        const url = `${backendBaseUrl}/api/todos?page=${page}&pageSize=${pageSize}`;
        const payload = await fetchJson<Record<string, unknown>>(url, { method: 'GET' });
        return {
          content: [{ type: 'text', text: `Feladatok lekérdezve: ${page}. oldal (pageSize=${pageSize}).` }],
          structuredContent: payload
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `A feladatok listázása nem sikerült: ${String(error)}` }]
        };
      }
    }
  );

  server.registerTool(
    'todos_get',
    {
      title: 'Feladat lekérése',
      description: 'Egy konkrét feladat lekérése azonosító alapján a backend gateway-n keresztül.',
      inputSchema: {
        id: z.string().min(1).describe('MongoDB ObjectId (azonosító)')
      }
    },
    async ({ id }): Promise<CallToolResult> => {
      try {
        const url = `${backendBaseUrl}/api/todos/${encodeURIComponent(id)}`;
        const payload = await fetchJson<Record<string, unknown>>(url, { method: 'GET' });
        return {
          content: [{ type: 'text', text: `Feladat lekérdezve: ${id}.` }],
          structuredContent: payload
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `A feladat lekérése nem sikerült: ${String(error)}` }]
        };
      }
    }
  );

  server.registerTool(
    'todos_create',
    {
      title: 'Új feladat létrehozása',
      description: 'Új feladat létrehozása a backend gateway-n keresztül.',
      inputSchema: {
        title: z.string().min(1).max(200),
        description: z.string().max(4000).optional(),
        isCompleted: z.boolean().default(false),
        dueAt: z
          .string()
          .datetime({ offset: true })
          .optional()
          .describe('ISO dátum-idő (pl. 2026-03-08T12:30:00Z)')
      }
    },
    async ({ title, description, isCompleted, dueAt }): Promise<CallToolResult> => {
      try {
        const url = `${backendBaseUrl}/api/todos`;
        const payload = await fetchJson<Record<string, unknown>>(url, {
          method: 'POST',
          body: JSON.stringify({
            title,
            description: description ?? null,
            isCompleted,
            dueAt: dueAt ?? null
          })
        });
        return {
          content: [{ type: 'text', text: 'Feladat létrehozva.' }],
          structuredContent: payload
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `A feladat létrehozása nem sikerült: ${String(error)}` }]
        };
      }
    }
  );

  server.registerTool(
    'todos_update',
    {
      title: 'Feladat frissítése',
      description: 'Meglévő feladat felülírása (PUT) a backend gateway-n keresztül.',
      inputSchema: {
        id: z.string().min(1).describe('MongoDB ObjectId (azonosító)'),
        title: z.string().min(1).max(200),
        description: z.string().max(4000).optional(),
        isCompleted: z.boolean().default(false),
        dueAt: z
          .string()
          .datetime({ offset: true })
          .optional()
          .describe('ISO dátum-idő (pl. 2026-03-08T12:30:00Z)')
      }
    },
    async ({ id, title, description, isCompleted, dueAt }): Promise<CallToolResult> => {
      try {
        const url = `${backendBaseUrl}/api/todos/${encodeURIComponent(id)}`;
        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description ?? null,
            isCompleted,
            dueAt: dueAt ?? null
          })
        });

        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${bodyText}`);
        }

        return {
          content: [{ type: 'text', text: `Feladat frissítve: ${id}.` }],
          structuredContent: { ok: true }
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `A feladat frissítése nem sikerült: ${String(error)}` }]
        };
      }
    }
  );

  server.registerTool(
    'todos_delete',
    {
      title: 'Feladat törlése',
      description: 'Feladat törlése a backend gateway-n keresztül.',
      inputSchema: {
        id: z.string().min(1).describe('MongoDB ObjectId (azonosító)')
      }
    },
    async ({ id }): Promise<CallToolResult> => {
      try {
        const url = `${backendBaseUrl}/api/todos/${encodeURIComponent(id)}`;
        const resp = await fetch(url, { method: 'DELETE' });

        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${bodyText}`);
        }

        return {
          content: [{ type: 'text', text: `Feladat törölve: ${id}.` }],
          structuredContent: { ok: true }
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `A feladat törlése nem sikerült: ${String(error)}` }]
        };
      }
    }
  );

  return server;
}

const mcpHost = process.env.MCP_HOST ?? '0.0.0.0';
const mcpPort = process.env.MCP_PORT ? Number.parseInt(process.env.MCP_PORT, 10) : 3000;
const allowedHosts = parseAllowedHosts(process.env.MCP_ALLOWED_HOSTS);

const app = createMcpExpressApp({ host: mcpHost, allowedHosts });

// Egyszerű CORS beállítás lokális teszthez. Éles környezetben érdemes szigorítani.
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id', 'Last-Event-Id', 'Mcp-Protocol-Version']
  })
);

const sessions: Record<string, Session> = {};

const postHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    if (sessionId && sessions[sessionId]) {
      await sessions[sessionId]!.transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const server = createTodoMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          sessions[newSessionId] = { server, transport };
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) {
          delete sessions[sid];
        }
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Hibás kérés: hiányzó vagy érvénytelen MCP session' },
      id: null
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Belső szerverhiba: ${String(error)}` },
        id: null
      });
    }
  }
};

const getHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions[sessionId]) {
    res.status(400).send('Hiányzó vagy érvénytelen session azonosító');
    return;
  }

  await sessions[sessionId]!.transport.handleRequest(req, res);
};

const deleteHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions[sessionId]) {
    res.status(400).send('Hiányzó vagy érvénytelen session azonosító');
    return;
  }

  await sessions[sessionId]!.transport.handleRequest(req, res);
};

app.post('/mcp', postHandler);
app.get('/mcp', getHandler);
app.delete('/mcp', deleteHandler);

app.listen(mcpPort, mcpHost, () => {
  // eslint-disable-next-line no-console
  console.log(`MCP szerver elindult: http://${mcpHost}:${mcpPort}/mcp`);
  // eslint-disable-next-line no-console
  console.log(`BACKEND_BASE_URL=${process.env.BACKEND_BASE_URL}`);
  // eslint-disable-next-line no-console
  console.log(`Engedélyezett hostok: ${allowedHosts.join(', ')}`);
});

process.on('SIGINT', async () => {
  for (const sessionId of Object.keys(sessions)) {
    await sessions[sessionId]!.transport.close().catch(() => undefined);
    delete sessions[sessionId];
  }
  process.exit(0);
});
