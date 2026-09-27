'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for reading, writing, listing, and deleting files within the sandbox workspace.
 */
class WorkspaceFileTool extends BaseTool {
  /** @type {import('@services/agent/sandbox/WorkspaceSandboxService')} */
  #workspaceSandboxService;

  /**
   * @param {import('@services/agent/sandbox/WorkspaceSandboxService')} workspaceSandboxService
   */
  constructor(workspaceSandboxService) {
    const schema = z.object({
      action: z.enum(['read', 'write', 'list', 'delete']).describe(
        localization.t('agent.tools.workspace_file.schema_action')
      ),
      path: z.string().default('').describe(
        localization.t('agent.tools.workspace_file.schema_path')
      ),
      content: z.string().optional().describe(
        localization.t('agent.tools.workspace_file.schema_content')
      ),
      encoding: z.string().default('utf8').describe('Encoding format (default utf8)')
    });

    super(
      'workspace_file',
      localization.t('agent.tools.workspace_file.description'),
      schema
    );

    this.#workspaceSandboxService = workspaceSandboxService;
  }

  async execute(parameters, context = {}) {
    if (!this.#workspaceSandboxService) {
      return {
        success: false,
        error: localization.t('agent.errors.service_unavailable', { serviceName: 'WorkspaceSandboxService' })
      };
    }

    try {
      const { action, path: targetPath, content, encoding } = parameters;

      switch (action) {
        case 'read': {
          const result = await this.#workspaceSandboxService.readFile(targetPath, encoding);
          return {
            success: true,
            action,
            path: result.path,
            sizeBytes: result.sizeBytes,
            content: result.content
          };
        }
        case 'write': {
          if (content === undefined || content === null) {
            return {
              success: false,
              error: localization.t('agent.tools.workspace_file.error_content_required')
            };
          }
          const result = await this.#workspaceSandboxService.writeFile(targetPath, content, encoding);
          return {
            success: true,
            action,
            path: result.path,
            sizeBytes: result.sizeBytes,
            bytesWritten: result.bytesWritten
          };
        }
        case 'list': {
          const result = await this.#workspaceSandboxService.listFiles(targetPath);
          return {
            success: true,
            action,
            directory: result.directory,
            entriesCount: result.entries.length,
            entries: result.entries
          };
        }
        case 'delete': {
          const result = await this.#workspaceSandboxService.deleteFile(targetPath);
          return {
            success: true,
            action,
            deletedPath: result.deletedPath
          };
        }
        default:
          return {
            success: false,
            error: localization.t('agent.tools.workspace_file.error_unknown_action', { action })
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = WorkspaceFileTool;
