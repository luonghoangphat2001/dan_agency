/**
 * @fileoverview WorkspaceController - REST API Controller for Workspace Sandbox operations.
 */
'use strict';

const BaseController = require('@controllers/BaseController');
const WorkspaceService = require('@services/sandbox/WorkspaceService');
const localization = require('@lang');

/**
 * Controller handling Workspace Sandbox file management and safe command execution.
 */
class WorkspaceController extends BaseController {
  /** @type {WorkspaceService} */
  #workspaceService;

  /**
   * @param {WorkspaceService} [workspaceService]
   */
  constructor(workspaceService = new WorkspaceService()) {
    super();
    this.#workspaceService = workspaceService;
  }

  /**
   * Reads a file in the workspace sandbox.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  async readFile(request, response) {
    try {
      const { path: relativePath, encoding = 'utf8' } = request.body;
      const result = await this.#workspaceService.readFile(relativePath, encoding);
      return this.ok(response, result);
    } catch (error) {
      return this.fail(response, error.message, 400);
    }
  }

  /**
   * Writes content to a file in the workspace sandbox.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  async writeFile(request, response) {
    try {
      const { path: relativePath, content = '', encoding = 'utf8' } = request.body;
      const result = await this.#workspaceService.writeFile(relativePath, content, encoding);
      return this.ok(response, result);
    } catch (error) {
      return this.fail(response, error.message, 400);
    }
  }

  /**
   * Lists files and folders in a workspace directory.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  async listFiles(request, response) {
    try {
      const relativePath = request.query.path || request.body.path || '';
      const result = await this.#workspaceService.listFiles(relativePath);
      return this.ok(response, result);
    } catch (error) {
      return this.fail(response, error.message, 400);
    }
  }

  /**
   * Deletes a file or directory in the workspace sandbox.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  async deleteFile(request, response) {
    try {
      const { path: relativePath } = request.body;
      const result = await this.#workspaceService.deleteFile(relativePath);
      return this.ok(response, result);
    } catch (error) {
      return this.fail(response, error.message, 400);
    }
  }

  /**
   * Executes a shell command inside the workspace sandbox.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  async executeCommand(request, response) {
    try {
      const { command, timeoutMs = 15000, environmentVariables = {} } = request.body;
      if (!command) {
        return this.fail(response, localization.t('workspace.errors.command_required'), 400);
      }
      const result = await this.#workspaceService.executeCommand(command, {
        timeoutMs,
        environmentVariables
      });
      return this.ok(response, result);
    } catch (error) {
      return this.fail(response, error.message, 400);
    }
  }
}

module.exports = WorkspaceController;
