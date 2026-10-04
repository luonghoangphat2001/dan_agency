'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const localization = require('@lang');

/**
 * Resolve the dan-api project root by walking upward to find package.json.
 * Prevents workspace path from breaking when this file is moved within src/.
 * @returns {string}
 */
function resolveProjectRoot() {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/**
 * WorkspaceSandboxService for Dan AI Agent.
 * Ensures all file reading/writing and command execution are strictly restricted
 * to the designated sandbox workspace directory.
 */
class WorkspaceSandboxService {
  /** @type {string} */
  #workspaceRoot;
  /** @type {import('@services/openclaw/OpenClawService')|null} */
  #openClawService;

  /**
   * @param {object} [options={}]
   * @param {string} [options.workspaceRoot]
   * @param {import('@services/openclaw/OpenClawService')|null} [options.openClawService]
   */
  constructor({ workspaceRoot = null, openClawService = null } = {}) {
    const configuredPath = workspaceRoot || process.env.DAN_AGENT_WORKSPACE_DIR;
    this.#workspaceRoot = configuredPath
      ? path.resolve(configuredPath)
      : path.join(resolveProjectRoot(), 'workspace');
    this.#openClawService = openClawService;

    this.#ensureWorkspaceDirectory();
  }

  /**
   * Ensures workspace root directory exists.
   */
  #ensureWorkspaceDirectory() {
    if (!fs.existsSync(this.#workspaceRoot)) {
      fs.mkdirSync(this.#workspaceRoot, { recursive: true });
    }
  }

  /**
   * Gets workspace root directory.
   * @returns {string}
   */
  getWorkspaceRoot() {
    return this.#workspaceRoot;
  }

  /**
   * Resolves safe relative path within workspace, preventing path traversal attacks.
   * @param {string} relativePath
   * @returns {string}
   */
  resolveSafePath(relativePath = '') {
    const sanitizedPath = String(relativePath || '').trim();
    const resolvedPath = path.resolve(this.#workspaceRoot, sanitizedPath);

    const relative = path.relative(this.#workspaceRoot, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(
        localization.t('agent.tools.workspace_file.error_traversal_blocked', {
          targetPath: sanitizedPath
        })
      );
    }

    return resolvedPath;
  }

  /**
   * Reads a file in the workspace sandbox.
   * @param {string} relativePath
   * @param {string} [encoding='utf8']
   * @returns {Promise<{ path: string, sizeBytes: number, content: string }>}
   */
  async readFile(relativePath, encoding = 'utf8') {
    if (this.#openClawService) {
      try {
        return await this.#openClawService.workspaceReadFile(relativePath, encoding);
      } catch (_) {
        // Fall back to local workspace if remote fails
      }
    }

    const absolutePath = this.resolveSafePath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(
        localization.t('agent.tools.workspace_file.error_file_not_found', {
          filePath: relativePath
        })
      );
    }

    const fileStats = await fs.promises.stat(absolutePath);
    if (!fileStats.isFile()) {
      throw new Error(
        localization.t('agent.tools.workspace_file.error_file_not_found', {
          filePath: relativePath
        })
      );
    }

    const content = await fs.promises.readFile(absolutePath, encoding);
    return {
      path: path.relative(this.#workspaceRoot, absolutePath),
      sizeBytes: fileStats.size,
      content
    };
  }

  /**
   * Writes content to a file in the workspace sandbox.
   * @param {string} relativePath
   * @param {string} content
   * @param {string} [encoding='utf8']
   * @returns {Promise<{ path: string, sizeBytes: number, bytesWritten: number }>}
   */
  async writeFile(relativePath, content, encoding = 'utf8') {
    if (this.#openClawService) {
      try {
        return await this.#openClawService.workspaceWriteFile(relativePath, content, encoding);
      } catch (_) {
        // Fall back to local workspace if remote fails
      }
    }

    const absolutePath = this.resolveSafePath(relativePath);
    const directoryPath = path.dirname(absolutePath);

    if (!fs.existsSync(directoryPath)) {
      await fs.promises.mkdir(directoryPath, { recursive: true });
    }

    const payload = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await fs.promises.writeFile(absolutePath, payload, encoding);
    const fileStats = await fs.promises.stat(absolutePath);

    return {
      path: path.relative(this.#workspaceRoot, absolutePath),
      sizeBytes: fileStats.size,
      bytesWritten: Buffer.byteLength(payload, encoding)
    };
  }

  /**
   * Lists files and folders in a workspace directory.
   * @param {string} [relativeDirectoryPath='']
   * @returns {Promise<{ directory: string, entries: Array<{ name: string, isDirectory: boolean, sizeBytes: number }> }>}
   */
  async listFiles(relativeDirectoryPath = '') {
    if (this.#openClawService) {
      try {
        return await this.#openClawService.workspaceListFiles(relativeDirectoryPath);
      } catch (_) {
        // Fall back to local workspace if remote fails
      }
    }

    const absolutePath = this.resolveSafePath(relativeDirectoryPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(
        localization.t('agent.tools.workspace_file.error_file_not_found', {
          filePath: relativeDirectoryPath
        })
      );
    }

    const dirents = await fs.promises.readdir(absolutePath, { withFileTypes: true });
    const entries = await Promise.all(
      dirents.map(async (dirent) => {
        const itemPath = path.join(absolutePath, dirent.name);
        let sizeBytes = 0;
        try {
          const stats = await fs.promises.stat(itemPath);
          sizeBytes = stats.size;
        } catch {
          // ignore stat errors on special items
        }
        return {
          name: dirent.name,
          isDirectory: dirent.isDirectory(),
          sizeBytes
        };
      })
    );

    return {
      directory: path.relative(this.#workspaceRoot, absolutePath) || '.',
      entries
    };
  }

  /**
   * Deletes a file or directory in the workspace sandbox.
   * @param {string} relativePath
   * @returns {Promise<{ success: boolean, deletedPath: string }>}
   */
  async deleteFile(relativePath) {
    if (this.#openClawService) {
      try {
        return await this.#openClawService.workspaceDeleteFile(relativePath);
      } catch (_) {
        // Fall back to local workspace if remote fails
      }
    }

    const absolutePath = this.resolveSafePath(relativePath);
    if (absolutePath === this.#workspaceRoot) {
      throw new Error(
        localization.t('agent.tools.workspace_file.error_traversal_blocked', {
          targetPath: relativePath
        })
      );
    }

    if (fs.existsSync(absolutePath)) {
      await fs.promises.rm(absolutePath, { recursive: true, force: true });
    }

    return {
      success: true,
      deletedPath: path.relative(this.#workspaceRoot, absolutePath)
    };
  }

  /**
   * Asserts whether a shell command is safe to execute.
   * @param {string} commandLine
   */
  #assertSafeCommand(commandLine) {
    const sanitizedCommand = String(commandLine || '').trim();
    const dangerousPatterns = [
      /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+\/(?!\w)/i,
      /\bmkfs\b/i,
      /\bdd\s+if=/i,
      /:(){ :|:& };:/,
      /\bshutdown\b/i,
      /\breboot\b/i,
      /\bchmod\s+-[a-zA-Z]*R\s+777\s+\//i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedCommand)) {
        throw new Error(
          localization.t('agent.tools.workspace_command.error_dangerous_command', {
            command: sanitizedCommand
          })
        );
      }
    }
  }

  /**
   * Executes a safe shell command within the workspace sandbox.
   * @param {string} command
   * @param {object} [executionOptions={}]
   * @param {number} [executionOptions.timeoutMs=15000]
   * @param {Record<string, string>} [executionOptions.environmentVariables={}]
   * @returns {Promise<{ command: string, exitCode: number, stdout: string, stderr: string, durationMs: number }>}
   */
  async executeCommand(command, { timeoutMs = 15000, environmentVariables = {} } = {}) {
    this.#assertSafeCommand(command);

    if (this.#openClawService) {
      try {
        return await this.#openClawService.workspaceExecuteCommand(command, {
          timeoutMs,
          environmentVariables
        });
      } catch (_) {
        // Fall back to local execution if remote fails
      }
    }

    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          cwd: this.#workspaceRoot,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
          env: {
            ...process.env,
            ...environmentVariables,
            DAN_AGENT_WORKSPACE: this.#workspaceRoot
          }
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          if (error && error.killed) {
            return reject(
              new Error(
                localization.t('agent.tools.workspace_command.error_timeout', {
                  timeoutMs
                })
              )
            );
          }

          resolve({
            command,
            exitCode: error ? (error.code || 1) : 0,
            stdout: stdout ? stdout.toString() : '',
            stderr: stderr ? stderr.toString() : (error ? error.message : ''),
            durationMs
          });
        }
      );
    });
  }
}

module.exports = WorkspaceSandboxService;
