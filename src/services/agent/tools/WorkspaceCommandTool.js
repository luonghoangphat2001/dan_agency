'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for executing safe shell commands within the isolated Workspace Sandbox.
 */
class WorkspaceCommandTool extends BaseTool {
  /** @type {import('@services/agent/sandbox/WorkspaceSandboxService')} */
  #workspaceSandboxService;

  /**
   * @param {import('@services/agent/sandbox/WorkspaceSandboxService')} workspaceSandboxService
   */
  constructor(workspaceSandboxService) {
    const schema = z.object({
      command: z.string().min(1).describe(
        localization.t('agent.tools.workspace_command.schema_command')
      ),
      timeoutMs: z.number().int().min(1000).max(60000).default(15000).describe(
        localization.t('agent.tools.workspace_command.schema_timeout_ms')
      )
    });

    super(
      'workspace_command',
      localization.t('agent.tools.workspace_command.description'),
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
      const { command, timeoutMs } = parameters;
      const result = await this.#workspaceSandboxService.executeCommand(command, { timeoutMs });

      return {
        success: result.exitCode === 0,
        command: result.command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = WorkspaceCommandTool;
