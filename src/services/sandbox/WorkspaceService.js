'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const localization = require('@lang');

/**
 * Resolve the openclaw project root by walking upward to find package.json.
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
  return path.resolve(__dirname, '../../..');
}

/**
 * Workspace Sandbox Service for OpenClaw.
 * Provides safe file system access and isolated shell execution restricted to the workspace directory.
 */
class WorkspaceService {
  /** @type {string} */
  #workspaceRoot;

  /**
   * @param {string} [workspaceRoot]
   */
  constructor(workspaceRoot = null) {
    const configuredPath = workspaceRoot || process.env.OPENCLAW_WORKSPACE_DIR;
    this.#workspaceRoot = configuredPath
      ? path.resolve(configuredPath)
      : path.join(resolveProjectRoot(), 'workspace');

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
   * Gets absolute workspace root path.
   * @returns {string}
   */
  getWorkspaceRoot() {
    return this.#workspaceRoot;
  }

  /**
   * Resolves a relative path to absolute, preventing directory traversal.
   * Throws Error if path resolves outside workspace.
   *
   * @param {string} relativePath
   * @returns {string}
   */
  resolveSafePath(relativePath = '') {
    const sanitizedPath = String(relativePath || '').trim();
    const resolvedPath = path.resolve(this.#workspaceRoot, sanitizedPath);

    const relative = path.relative(this.#workspaceRoot, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(localization.t('workspace.errors.path_traversal_forbidden', { targetPath: sanitizedPath }));
    }

    return resolvedPath;
  }

  /**
   * Reads file content inside the workspace sandbox.
   *
   * @param {string} relativePath
   * @param {string} [encoding='utf8']
   * @returns {Promise<{ path: string, sizeBytes: number, content: string }>}
   */
  async readFile(relativePath, encoding = 'utf8') {
    const absolutePath = this.resolveSafePath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(localization.t('workspace.errors.file_not_found', { filePath: relativePath }));
    }

    const fileStats = await fs.promises.stat(absolutePath);
    if (!fileStats.isFile()) {
      throw new Error(localization.t('workspace.errors.file_not_found', { filePath: relativePath }));
    }

    const content = await fs.promises.readFile(absolutePath, encoding);
    return {
      path: path.relative(this.#workspaceRoot, absolutePath),
      sizeBytes: fileStats.size,
      content
    };
  }

  /**
   * Writes content to a file inside the workspace sandbox.
   * Auto-creates parent directories if needed.
   *
   * @param {string} relativePath
   * @param {string} content
   * @param {string} [encoding='utf8']
   * @returns {Promise<{ path: string, sizeBytes: number, bytesWritten: number }>}
   */
  async writeFile(relativePath, content, encoding = 'utf8') {
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
   * Lists contents of a directory inside workspace sandbox.
   *
   * @param {string} [relativeDirectoryPath='']
   * @returns {Promise<{ directory: string, entries: Array<{ name: string, isDirectory: boolean, sizeBytes: number }> }>}
   */
  async listFiles(relativeDirectoryPath = '') {
    const absolutePath = this.resolveSafePath(relativeDirectoryPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(localization.t('workspace.errors.file_not_found', { filePath: relativeDirectoryPath }));
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
   * Deletes a file or directory inside the workspace sandbox.
   *
   * @param {string} relativePath
   * @returns {Promise<{ success: boolean, deletedPath: string }>}
   */
  async deleteFile(relativePath) {
    const absolutePath = this.resolveSafePath(relativePath);
    if (absolutePath === this.#workspaceRoot) {
      throw new Error(localization.t('workspace.errors.path_traversal_forbidden', { targetPath: relativePath }));
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
    // Dangerous destructive patterns
    const dangerousPatterns = [
      /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+\/(?!\w)/i, // rm -rf /
      /\bmkfs\b/i,
      /\bdd\s+if=/i,
      /:(){ :|:& };:/, // fork bomb
      /\bshutdown\b/i,
      /\breboot\b/i,
      /\bchmod\s+-[a-zA-Z]*R\s+777\s+\//i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedCommand)) {
        throw new Error(localization.t('workspace.errors.dangerous_command_blocked', { command: sanitizedCommand }));
      }
    }
  }

  /**
   * Executes a shell command within the workspace directory.
   *
   * @param {string} command
   * @param {object} [executionOptions={}]
   * @param {number} [executionOptions.timeoutMs=15000]
   * @param {Record<string, string>} [executionOptions.environmentVariables={}]
   * @returns {Promise<{ command: string, exitCode: number, stdout: string, stderr: string, durationMs: number }>}
   */
  async executeCommand(command, { timeoutMs = 15000, environmentVariables = {} } = {}) {
    this.#assertSafeCommand(command);

    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          cwd: this.#workspaceRoot,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024, // 1MB buffer
          env: {
            ...process.env,
            ...environmentVariables,
            OPENCLAW_WORKSPACE: this.#workspaceRoot
          }
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          if (error && error.killed) {
            return reject(new Error(localization.t('workspace.errors.command_timeout', { timeoutMs })));
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

module.exports = WorkspaceService;
