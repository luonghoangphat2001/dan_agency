#!/usr/bin/env node
'use strict';

/**
 * OpenClaw CLI Tool
 * Command-line interface for managing and monitoring the OpenClaw Gateway & Agent Platform.
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Register module aliases
require('module-alias')({
  base: path.resolve(__dirname, '..'),
  '@config': path.resolve(__dirname, '../src/config'),
  '@utils': path.resolve(__dirname, '../src/utils'),
  '@services': path.resolve(__dirname, '../src/services'),
  '@controllers': path.resolve(__dirname, '../src/controllers'),
  '@middleware': path.resolve(__dirname, '../src/middleware'),
  '@repositories': path.resolve(__dirname, '../src/repositories'),
  '@routes': path.resolve(__dirname, '../src/routes'),
  '@schemas': path.resolve(__dirname, '../src/schemas'),
  '@validations': path.resolve(__dirname, '../src/validations'),
  '@policy': path.resolve(__dirname, '../src/policy'),
  '@database': path.resolve(__dirname, '../src/database'),
  '@docs': path.resolve(__dirname, '../src/docs'),
  '@app': path.resolve(__dirname, '../src/app.js'),
  '@server': path.resolve(__dirname, '../src/server.js'),
  '@lang': path.resolve(__dirname, '../src/lang')
});

const WorkspaceService = require('@services/sandbox/WorkspaceService');
const SkillService = require('@services/skills/SkillService');

// ANSI Color formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function banner() {
  console.log(`
${colors.cyan}${colors.bold}  ____  _____  ______ _   _  _____ _        __          __
 / __ \\|  __ \\|  ____| \\ | |/ ____| |      /\\ \\        / /
| |  | | |__) | |__  |  \\| | |    | |     /  \\ \\  /\\  / / 
| |  | |  ___/|  __| | . \` | |    | |    / /\\ \\ \\/  \\/ /  
| |__| | |    | |____| |\\  | |____| |___/ ____ \\  /\\  /   
 \\____/|_|    |______|_| \\_|\\_____|______/_/    \\_\\/  \\/    ${colors.reset}
  ${colors.yellow}${colors.bold}GATEWAY & AGENT CONTROL INTERFACE (v1.0.0)${colors.reset}
`);
}

async function commandStatus() {
  banner();
  console.log(`${colors.bold}--- [GATEWAY SYSTEM STATUS] ---${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Node.js Runtime : ${colors.cyan}${process.version}${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Platform        : ${colors.cyan}${process.platform} (${process.arch})${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Process PID     : ${colors.cyan}${process.pid}${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Memory Heap Used: ${colors.cyan}${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Sandbox Path    : ${colors.cyan}${new WorkspaceService().getWorkspaceRoot()}${colors.reset}`);
  console.log(`  ${colors.green}●${colors.reset} Skills Path     : ${colors.cyan}${new SkillService().getSkillsDirectory()}${colors.reset}`);

  // Test HTTP gateway connection if available
  const gatewayUrl = process.env.OPENCLAW_URL || 'http://localhost:4000';
  try {
    const http = require('http');
    await new Promise((resolve) => {
      const request = http.get(`${gatewayUrl}/health`, (response) => {
        if (response.statusCode === 200) {
          console.log(`  ${colors.green}●${colors.reset} Gateway Service : ${colors.green}ONLINE (${gatewayUrl})${colors.reset}`);
        } else {
          console.log(`  ${colors.yellow}●${colors.reset} Gateway Service : ${colors.yellow}HTTP ${response.statusCode}${colors.reset}`);
        }
        resolve();
      });
      request.on('error', () => {
        console.log(`  ${colors.dim}●${colors.reset} Gateway Service : ${colors.dim}STANDALONE (daemon not running on ${gatewayUrl})${colors.reset}`);
        resolve();
      });
      request.setTimeout(1000, () => {
        request.destroy();
        resolve();
      });
    });
  } catch (_) {
    // Standalone fallback
  }

  console.log('');
}

async function commandAgentList() {
  banner();
  console.log(`${colors.bold}--- [REGISTERED AGENTS] ---${colors.reset}\n`);

  let agents = [];
  try {
    const agentRegistry = require('@services/ai/agents/agent-registry');
    agents = agentRegistry.list();
  } catch (_) {
    // Default system agent catalog
    agents = [
      { id: 'cfo', role: 'Chief Financial Officer', capabilities: ['budget_audit', 'roi_analysis'] },
      { id: 'cskh', role: 'Customer Success & Support', capabilities: ['ticket_triage', 'faq_assist'] },
      { id: 'logistics', role: 'Supply Chain & Logistics', capabilities: ['inventory_track', 'order_status'] },
      { id: 'ops', role: 'Operations & SRE', capabilities: ['health_monitor', 'incident_response'] },
      { id: 'rnd', role: 'Research & Development', capabilities: ['code_review', 'architecture_check'] }
    ];
  }

  if (agents.length === 0) {
    console.log(`  ${colors.yellow}No agents registered in registry.${colors.reset}\n`);
    return;
  }

  console.log(`  ${colors.bold}${'ID'.padEnd(16)} ${'ROLE'.padEnd(30)} ${'STATUS'.padEnd(14)} ${'CAPABILITIES'}${colors.reset}`);
  console.log(`  ${'-'.repeat(78)}`);

  for (const agent of agents) {
    const id = (agent.id || agent.name || 'agent').padEnd(16);
    const role = (agent.role || agent.description || 'Specialized Agent').padEnd(30);
    const status = `${colors.green}ACTIVE${colors.reset}`.padEnd(23);
    const capabilities = Array.isArray(agent.capabilities) ? agent.capabilities.join(', ') : 'standard';

    console.log(`  ${colors.cyan}${id}${colors.reset} ${role} ${status} ${colors.dim}${capabilities}${colors.reset}`);
  }
  console.log('');
}

async function commandSkillList() {
  banner();
  console.log(`${colors.bold}--- [DYNAMIC SKILL PACKAGES (SKILL.md)] ---${colors.reset}\n`);

  const skillService = new SkillService();
  const skills = skillService.listSkills();

  if (skills.length === 0) {
    console.log(`  ${colors.yellow}No SKILL.md packages found in ${skillService.getSkillsDirectory()}.${colors.reset}\n`);
    return;
  }

  console.log(`  ${colors.bold}${'NAME'.padEnd(24)} ${'VERSION'.padEnd(10)} ${'TAGS'.padEnd(26)} ${'DESCRIPTION'}${colors.reset}`);
  console.log(`  ${'-'.repeat(85)}`);

  for (const skill of skills) {
    const name = skill.name.padEnd(24);
    const version = (skill.version || '1.0.0').padEnd(10);
    const tags = (skill.tags.join(', ') || '-').padEnd(26);
    const description = skill.description || '';

    console.log(`  ${colors.green}${colors.bold}${name}${colors.reset} ${colors.yellow}${version}${colors.reset} ${colors.dim}${tags}${colors.reset} ${description}`);
  }
  console.log(`\n  ${colors.dim}Total: ${skills.length} skills loaded.${colors.reset}\n`);
}

async function commandSkillShow(skillName) {
  if (!skillName) {
    console.error(`${colors.red}Error: Please specify skill name. Usage: openclaw skill:show <name>${colors.reset}`);
    process.exitCode = 1;
    return;
  }

  const skillService = new SkillService();
  const skill = skillService.getSkill(skillName);

  if (!skill) {
    console.error(`${colors.red}Error: Skill "${skillName}" not found.${colors.reset}`);
    const available = skillService.listSkills().map((s) => s.name);
    console.log(`Available skills: ${available.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  banner();
  console.log(`${colors.bold}--- [SKILL: ${skill.name} v${skill.version}] ---${colors.reset}`);
  console.log(`Author     : ${skill.author}`);
  console.log(`Tags       : ${skill.tags.join(', ')}`);
  console.log(`Description: ${skill.description}`);
  console.log(`File Path  : ${skill.filePath}`);
  console.log(`\n${colors.cyan}--- [INSTRUCTIONS (SOP)] ---${colors.reset}\n`);
  console.log(skill.content);
  console.log('');
}

async function commandWorkspaceList(directory = '') {
  banner();
  console.log(`${colors.bold}--- [WORKSPACE SANDBOX: ${directory || '/'}] ---${colors.reset}\n`);

  const workspace = new WorkspaceService();
  try {
    const result = await workspace.listFiles(directory);
    if (result.entries.length === 0) {
      console.log(`  ${colors.dim}(Workspace directory is empty)${colors.reset}\n`);
      return;
    }

    console.log(`  ${colors.bold}${'TYPE'.padEnd(8)} ${'SIZE'.padEnd(12)} ${'NAME'}${colors.reset}`);
    console.log(`  ${'-'.repeat(45)}`);

    for (const entry of result.entries) {
      const type = entry.isDirectory ? `${colors.blue}[DIR]${colors.reset} ` : `${colors.green}[FILE]${colors.reset}`;
      const size = `${entry.sizeBytes} B`.padEnd(12);
      console.log(`  ${type.padEnd(16)} ${size} ${entry.name}`);
    }
    console.log(`\n  ${colors.dim}Total: ${result.entries.length} items${colors.reset}\n`);
  } catch (error) {
    console.error(`  ${colors.red}Error: ${error.message}${colors.reset}\n`);
  }
}

async function commandWorkspaceCat(filePath) {
  if (!filePath) {
    console.error(`${colors.red}Error: Please specify file path. Usage: openclaw workspace:cat <filePath>${colors.reset}`);
    process.exitCode = 1;
    return;
  }

  const workspace = new WorkspaceService();
  try {
    const file = await workspace.readFile(filePath);
    console.log(`\n${colors.dim}=== [WORKSPACE FILE: ${file.path} (${file.sizeBytes} bytes)] ===${colors.reset}\n`);
    console.log(file.content);
    console.log('');
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

async function commandWorkspaceExec(command) {
  if (!command) {
    console.error(`${colors.red}Error: Please specify command. Usage: openclaw workspace:exec "<command>"${colors.reset}`);
    process.exitCode = 1;
    return;
  }

  const workspace = new WorkspaceService();
  console.log(`${colors.dim}Executing in Workspace: ${command}...${colors.reset}\n`);
  try {
    const result = await workspace.executeCommand(command);
    if (result.stdout) {
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.error(`${colors.red}${result.stderr}${colors.reset}`);
    }
    console.log(`\n${colors.dim}[Exit Code: ${result.exitCode}, Duration: ${result.durationMs}ms]${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Command failed: ${error.message}${colors.reset}`);
  }
}

async function commandChat(promptText) {
  banner();
  if (!promptText) {
    console.log(`${colors.yellow}Usage: openclaw chat "<your question or task>"${colors.reset}\n`);
    return;
  }

  console.log(`${colors.bold}User:${colors.reset} ${promptText}\n`);
  console.log(`${colors.cyan}Thinking & executing reasoning steps...${colors.reset}`);

  // Query dan-api if available
  const apiUrl = process.env.DAN_API_URL || 'http://localhost:3000';
  const axios = require('axios');

  try {
    const response = await axios.post(`${apiUrl}/api/agent/chat`, {
      prompt: promptText,
      platform: 'cli',
      userId: 'cli_admin'
    }, { timeout: 45000 });

    const data = response.data;
    if (data.success && data.data) {
      console.log(`\n${colors.green}${colors.bold}Dan AI Agent:${colors.reset}\n`);
      console.log(data.data.answer);
      console.log(`\n${colors.dim}[Steps: ${data.data.totalSteps || 1}, Tokens: in=${data.data.tokensIn || 0} out=${data.data.tokensOut || 0}]${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}Response:${colors.reset}`, data);
    }
  } catch (error) {
    console.log(`\n${colors.yellow}Dan API Agent offline on ${apiUrl}: ${error.message}${colors.reset}`);
    console.log(`${colors.dim}Please ensure docker container dan_ai_api is running.${colors.reset}\n`);
  }
}

function showHelp() {
  banner();
  console.log(`${colors.bold}USAGE:${colors.reset}`);
  console.log(`  openclaw <command> [arguments]\n`);
  console.log(`${colors.bold}COMMANDS:${colors.reset}`);
  console.log(`  ${colors.green}status${colors.reset}                  Check Gateway, node runtime, sandbox & database health`);
  console.log(`  ${colors.green}agent:list${colors.reset}              List all registered Autonomous Agents & roles`);
  console.log(`  ${colors.green}skill:list${colors.reset}              List all installed dynamic SKILL.md packages`);
  console.log(`  ${colors.green}skill:show <name>${colors.reset}       Display detailed SOP instructions for a skill`);
  console.log(`  ${colors.green}workspace:list [dir]${colors.reset}    List files in isolated Workspace Sandbox`);
  console.log(`  ${colors.green}workspace:cat <file>${colors.reset}    Print file content from Workspace Sandbox`);
  console.log(`  ${colors.green}workspace:exec <cmd>${colors.reset}    Execute safe bash command in Workspace Sandbox`);
  console.log(`  ${colors.green}chat "<prompt>"${colors.reset}         Send task/prompt to Dan AI Agent via Gateway`);
  console.log(`  ${colors.green}help${colors.reset}                    Display this help message\n`);
  console.log(`${colors.bold}EXAMPLES:${colors.reset}`);
  console.log(`  openclaw status`);
  console.log(`  openclaw skill:list`);
  console.log(`  openclaw skill:show code-review`);
  console.log(`  openclaw workspace:list`);
  console.log(`  openclaw workspace:exec "ls -la"`);
  console.log(`  openclaw chat "Phân tích thị trường công nghệ giáo dục"\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const param = args.slice(1).join(' ');

  switch (command) {
    case 'status':
    case 'info':
      await commandStatus();
      break;
    case 'agent:list':
    case 'agents':
      await commandAgentList();
      break;
    case 'skill:list':
    case 'skills':
      await commandSkillList();
      break;
    case 'skill:show':
    case 'skill:info':
      await commandSkillShow(args[1]);
      break;
    case 'workspace:list':
    case 'workspace:ls':
      await commandWorkspaceList(args[1] || '');
      break;
    case 'workspace:cat':
    case 'workspace:read':
      await commandWorkspaceCat(args[1]);
      break;
    case 'workspace:exec':
    case 'workspace:run':
      await commandWorkspaceExec(param);
      break;
    case 'chat':
    case 'ask':
      await commandChat(param);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal CLI Error:${colors.reset}`, error);
  process.exitCode = 1;
});
