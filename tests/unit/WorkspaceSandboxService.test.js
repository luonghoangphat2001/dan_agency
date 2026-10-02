'use strict';

const fs = require('fs');
const path = require('path');
const WorkspaceSandboxService = require('@services/agent/sandbox/WorkspaceSandboxService');

describe('WorkspaceSandboxService', () => {
  const testWorkspaceDir = path.resolve(__dirname, '../fixtures/sandbox_test');
  let workspaceService;

  beforeAll(() => {
    if (!fs.existsSync(testWorkspaceDir)) {
      fs.mkdirSync(testWorkspaceDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testWorkspaceDir)) {
      fs.rmSync(testWorkspaceDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    workspaceService = new WorkspaceSandboxService({ workspaceRoot: testWorkspaceDir });
  });

  test('should safely write and read file within sandbox', async () => {
    const writeResult = await workspaceService.writeFile('test.txt', 'Hello Dan AI');
    expect(writeResult.bytesWritten).toBeGreaterThan(0);

    const readResult = await workspaceService.readFile('test.txt');
    expect(readResult.content).toBe('Hello Dan AI');
  });

  test('should list files in sandbox directory', async () => {
    await workspaceService.writeFile('sample_dir/file1.txt', 'one');
    await workspaceService.writeFile('sample_dir/file2.txt', 'two');

    const listResult = await workspaceService.listFiles('sample_dir');
    expect(listResult.entries.length).toBe(2);
    expect(listResult.entries.map((e) => e.name).sort()).toEqual(['file1.txt', 'file2.txt']);
  });

  test('should block directory traversal attempt', () => {
    expect(() => {
      workspaceService.resolveSafePath('../../etc/passwd');
    }).toThrow();
  });

  test('should block dangerous shell commands', async () => {
    await expect(
      workspaceService.executeCommand('rm -rf /')
    ).rejects.toThrow();

    await expect(
      workspaceService.executeCommand(':(){ :|:& };:')
    ).rejects.toThrow();
  });

  test('should safely execute benign shell command', async () => {
    const result = await workspaceService.executeCommand('echo "sandbox ok"');
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('sandbox ok');
  });

  test('should delete file in sandbox', async () => {
    await workspaceService.writeFile('temp_to_delete.txt', 'bye');
    const deleteResult = await workspaceService.deleteFile('temp_to_delete.txt');
    expect(deleteResult.success).toBe(true);

    await expect(
      workspaceService.readFile('temp_to_delete.txt')
    ).rejects.toThrow();
  });
});
