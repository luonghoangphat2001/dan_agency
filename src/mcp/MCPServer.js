'use strict';

const { Router } = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const localization = require('@lang');

/**
 * Standardized Model Context Protocol (MCP) Server for OpenClaw.
 * Exposes Web Search, Web Crawl (Playwright), HTTP Fetch, and Browser Automation tools.
 *
 * @param {Record<string, any>} controllers
 * @returns {McpServer}
 */
function createMcpServer(controllers = {}) {
  const server = new McpServer({
    name: 'openclaw-execution-platform',
    version: '2.0.0'
  });

  const webController = controllers.web || controllers.search;
  const dashboardController = controllers.dashboard;

  // 1. Tool: openclaw_web_search
  server.tool(
    'openclaw_web_search',
    localization.t('mcp.tools.web_search.description'),
    {
      query: z.string().describe(localization.t('mcp.tools.web_search.schema_query')),
      num: z.number().int().min(1).max(20).default(5).describe(localization.t('mcp.tools.web_search.schema_num'))
    },
    async ({ query, num }) => {
      try {
        if (!webController) {
          throw new Error(localization.t('mcp.errors.controller_unavailable', { controllerName: 'WebController' }));
        }
        const mockRequest = { body: { query, num } };
        let responseData = null;
        const mockResponse = {
          json: (data) => { responseData = data; return mockResponse; },
          status: () => mockResponse
        };
        await webController.search(mockRequest, mockResponse);
        return {
          content: [{ type: 'text', text: JSON.stringify(responseData || {}) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: localization.t('mcp.tools.web_search.error_search_failed', { errorMessage: error.message }) }]
        };
      }
    }
  );

  // 2. Tool: openclaw_web_crawl
  server.tool(
    'openclaw_web_crawl',
    localization.t('mcp.tools.web_crawl.description'),
    {
      url: z.string().url().describe(localization.t('mcp.tools.web_crawl.schema_url')),
      selector: z.string().optional().describe(localization.t('mcp.tools.web_crawl.schema_selector'))
    },
    async ({ url, selector }) => {
      try {
        if (!webController) {
          throw new Error(localization.t('mcp.errors.controller_unavailable', { controllerName: 'WebController' }));
        }
        const mockRequest = { body: { url, selector } };
        let responseData = null;
        const mockResponse = {
          json: (data) => { responseData = data; return mockResponse; },
          status: () => mockResponse
        };
        await webController.crawl(mockRequest, mockResponse);
        return {
          content: [{ type: 'text', text: JSON.stringify(responseData || {}) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: localization.t('mcp.tools.web_crawl.error_crawl_failed', { errorMessage: error.message }) }]
        };
      }
    }
  );

  // 3. Tool: openclaw_http_fetch
  server.tool(
    'openclaw_http_fetch',
    localization.t('mcp.tools.http_fetch.description'),
    {
      url: z.string().url().describe(localization.t('mcp.tools.http_fetch.schema_url')),
      method: z.string().default('GET').describe(localization.t('mcp.tools.http_fetch.schema_method')),
      headers: z.record(z.string()).optional().describe(localization.t('mcp.tools.http_fetch.schema_headers')),
      body: z.string().optional().describe(localization.t('mcp.tools.http_fetch.schema_body'))
    },
    async ({ url, method, headers, body }) => {
      try {
        if (!webController) {
          throw new Error(localization.t('mcp.errors.controller_unavailable', { controllerName: 'WebController' }));
        }
        const mockRequest = { body: { url, method, headers, body } };
        let responseData = null;
        const mockResponse = {
          json: (data) => { responseData = data; return mockResponse; },
          status: () => mockResponse
        };
        await webController.fetch(mockRequest, mockResponse);
        return {
          content: [{ type: 'text', text: JSON.stringify(responseData || {}) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: localization.t('mcp.tools.http_fetch.error_fetch_failed', { errorMessage: error.message }) }]
        };
      }
    }
  );

  // 4. Tool: openclaw_company_metrics
  if (dashboardController) {
    server.tool(
      'openclaw_company_metrics',
      localization.t('mcp.tools.company_metrics.description'),
      {
        period: z.enum(['today', 'month', 'quarter', 'year']).default('today').describe(localization.t('mcp.tools.company_metrics.schema_period'))
      },
      async ({ period }) => {
        try {
          const mockRequest = { query: { period } };
          let responseData = null;
          const mockResponse = {
            json: (data) => { responseData = data; return mockResponse; },
            status: () => mockResponse
          };
          await dashboardController.getCompanyDashboardMetrics(mockRequest, mockResponse);
          return {
            content: [{ type: 'text', text: JSON.stringify(responseData || {}) }]
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: 'text', text: localization.t('mcp.tools.company_metrics.error_metrics_failed', { errorMessage: error.message }) }]
          };
        }
      }
    );
  }
  // 5. Workspace Sandbox Tools
  const sandbox = controllers.workspace || new (require('@services/sandbox/WorkspaceService'))();

  server.tool(
    'openclaw_workspace_read_file',
    localization.t('workspace.tools.read_file.description'),
    {
      path: z.string().describe(localization.t('workspace.tools.read_file.schema_path'))
    },
    async ({ path: targetPath }) => {
      try {
        const result = await sandbox.readFile(targetPath);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }]
        };
      }
    }
  );

  server.tool(
    'openclaw_workspace_write_file',
    localization.t('workspace.tools.write_file.description'),
    {
      path: z.string().describe(localization.t('workspace.tools.write_file.schema_path')),
      content: z.string().describe(localization.t('workspace.tools.write_file.schema_content'))
    },
    async ({ path: targetPath, content }) => {
      try {
        const result = await sandbox.writeFile(targetPath, content);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }]
        };
      }
    }
  );

  server.tool(
    'openclaw_workspace_list_files',
    localization.t('workspace.tools.list_files.description'),
    {
      path: z.string().optional().default('').describe(localization.t('workspace.tools.list_files.schema_path'))
    },
    async ({ path: targetPath }) => {
      try {
        const result = await sandbox.listFiles(targetPath);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }]
        };
      }
    }
  );

  server.tool(
    'openclaw_workspace_execute_command',
    localization.t('workspace.tools.execute_command.description'),
    {
      command: z.string().describe(localization.t('workspace.tools.execute_command.schema_command')),
      timeout: z.number().int().min(1000).max(60000).default(15000).describe(localization.t('workspace.tools.execute_command.schema_timeout'))
    },
    async ({ command, timeout }) => {
      try {
        const result = await sandbox.executeCommand(command, { timeoutMs: timeout });
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }]
        };
      }
    }
  );

  return server;
}

/**
 * Creates an Express router mounting the MCP SSE endpoint and message handler.
 * @param {McpServer} mcpServer
 * @returns {Router}
 */
function createMcpRouter(mcpServer) {
  const router = Router();
  /** @type {Map<string, SSEServerTransport>} */
  const transports = new Map();

  router.get('/sse', async (request, response) => {
    console.log('[OpenClaw MCP] Client connected to SSE');
    const transport = new SSEServerTransport('/mcp/messages', response);
    transports.set(transport.sessionId, transport);

    request.on('close', () => {
      console.log(`[OpenClaw MCP] Session closed: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
    });

    await mcpServer.connect(transport);
  });

  router.post('/messages', async (request, response) => {
    const sessionId = request.query.sessionId;
    const transport = transports.get(sessionId);

    if (!transport) {
      return response.status(404).json({ error: localization.t('mcp.session.not_found') });
    }

    await transport.handlePostMessage(request, response);
  });

  return router;
}

module.exports = {
  createMcpServer,
  createMcpRouter
};
