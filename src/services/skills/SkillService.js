'use strict';

const fs = require('fs');
const path = require('path');
const localization = require('@lang');

/**
 * Resolve the openclaw project root by walking upward to find package.json.
 * Prevents skills directory path from breaking when this file is moved within src/.
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
 * Service managing dynamic Markdown skills (SKILL.md packages) for OpenClaw.
 * Parses frontmatter metadata and SOP instructions dynamically at runtime.
 */
class SkillService {
  /** @type {string} */
  #skillsDirectory;
  /** @type {Map<string, object>} */
  #skillsCache = new Map();

  /**
   * @param {string} [skillsDirectory]
   */
  constructor(skillsDirectory = null) {
    const configuredPath = skillsDirectory || process.env.OPENCLAW_SKILLS_DIR;
    this.#skillsDirectory = configuredPath
      ? path.resolve(configuredPath)
      : path.join(resolveProjectRoot(), 'skills');

    this.#ensureDirectory();
    this.reloadSkills();
  }

  #ensureDirectory() {
    if (!fs.existsSync(this.#skillsDirectory)) {
      fs.mkdirSync(this.#skillsDirectory, { recursive: true });
    }
  }

  /**
   * Gets skills directory root.
   * @returns {string}
   */
  getSkillsDirectory() {
    return this.#skillsDirectory;
  }

  /**
   * Parses YAML frontmatter and body from Markdown content.
   *
   * @param {string} rawContent
   * @returns {{ metadata: Record<string, any>, body: string }}
   */
  parseFrontmatter(rawContent) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = frontmatterRegex.exec(rawContent.trim());

    if (!match) {
      return { metadata: {}, body: rawContent.trim() };
    }

    const yamlBlock = match[1];
    const body = match[2].trim();
    const metadata = {};

    for (const line of yamlBlock.split('\n')) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, colonIndex).trim();
      let value = trimmedLine.slice(colonIndex + 1).trim();

      // Parse arrays e.g. [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      } else {
        // Strip outer quotes if any
        value = value.replace(/^['"]|['"]$/g, '');
      }

      metadata[key] = value;
    }

    return { metadata, body };
  }

  /**
   * Parses Markdown sections (e.g. ## Section Title) into a dictionary keyed by title and slug.
   * @param {string} body
   * @returns {Record<string, string>}
   */
  parseSections(body) {
    const sections = {};
    if (!body) return sections;
    const headerRegex = /(?:^|\n)##+\s+([^\n]+)\n([\s\S]*?)(?=(?:\n##+\s+[^\n]+)|$)/g;
    let match;
    while ((match = headerRegex.exec(body)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      sections[title] = content;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      if (slug) {
        sections[slug] = content;
      }
    }
    return sections;
  }

  /**
   * Renders a template string by replacing {{key}} placeholders with corresponding values.
   * @param {string} template
   * @param {Record<string, any>} [variables={}]
   * @returns {string}
   */
  renderTemplate(template, variables = {}) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
    });
  }

  /**
   * Scans and loads all SKILL.md packages from the skills directory into memory cache.
   * @returns {Map<string, object>}
   */
  reloadSkills() {
    this.#skillsCache.clear();

    if (!fs.existsSync(this.#skillsDirectory)) {
      return this.#skillsCache;
    }

    const items = fs.readdirSync(this.#skillsDirectory, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) {
        continue;
      }

      const skillPath = path.join(this.#skillsDirectory, item.name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        continue;
      }

      try {
        const rawContent = fs.readFileSync(skillPath, 'utf8');
        const { metadata, body } = this.parseFrontmatter(rawContent);

        const skillName = metadata.name || item.name;
        const skillRecord = {
          name: skillName,
          slug: item.name,
          description: metadata.description || 'No description provided.',
          version: metadata.version || '1.0.0',
          author: metadata.author || 'OpenClaw',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          content: body,
          raw: rawContent,
          filePath: skillPath,
          metadata,
          sections: this.parseSections(body)
        };

        this.#skillsCache.set(skillName, skillRecord);
      } catch (error) {
        console.warn(`[SkillService] Failed to load skill at ${skillPath}:`, error.message);
      }
    }

    return this.#skillsCache;
  }

  /**
   * Returns list of all available skills metadata (without full markdown content).
   * @returns {Array<{ name: string, slug: string, description: string, version: string, author: string, tags: string[] }>}
   */
  listSkills() {
    return Array.from(this.#skillsCache.values()).map((skill) => ({
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      version: skill.version,
      author: skill.author,
      tags: skill.tags
    }));
  }

  /**
   * Gets specific skill with full instructions content.
   * Supports discovery by exact name, slug, metadata type, or normalized variant.
   * @param {string} skillName
   * @returns {object|null}
   */
  getSkill(skillName) {
    if (!skillName) {
      return null;
    }
    if (this.#skillsCache.has(skillName)) {
      return this.#skillsCache.get(skillName);
    }
    const normalizedTarget = String(skillName).toLowerCase().trim();
    const candidateVariants = new Set([
      normalizedTarget,
      normalizedTarget.replace(/_/g, '-'),
      normalizedTarget.replace(/-/g, '_'),
      normalizedTarget.startsWith('learning-') ? normalizedTarget.replace(/^learning-/, '') : `learning-${normalizedTarget}`,
      normalizedTarget.startsWith('learning_') ? normalizedTarget.replace(/^learning_/, '') : `learning_${normalizedTarget}`,
    ]);

    for (const skill of this.#skillsCache.values()) {
      if (
        candidateVariants.has(skill.name?.toLowerCase()) ||
        candidateVariants.has(skill.slug?.toLowerCase()) ||
        candidateVariants.has(skill.metadata?.type?.toLowerCase()) ||
        candidateVariants.has(skill.metadata?.category?.toLowerCase())
      ) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Searches skills by keyword across name, description and tags.
   * @param {string} query
   * @returns {Array<object>}
   */
  searchSkills(query) {
    const sanitized = String(query || '').toLowerCase().trim();
    if (!sanitized) {
      return this.listSkills();
    }

    return this.listSkills().filter((skill) => {
      const matchName = skill.name.toLowerCase().includes(sanitized);
      const matchDesc = skill.description.toLowerCase().includes(sanitized);
      const matchTags = skill.tags.some((tag) => tag.toLowerCase().includes(sanitized));
      return matchName || matchDesc || matchTags;
    });
  }

  /**
   * Formats available skills into a concise Markdown summary for Agent system prompt injection.
   * @returns {string}
   */
  formatSkillsForPrompt() {
    const skills = this.listSkills();
    if (skills.length === 0) {
      return '';
    }

    const lines = [localization.t('agents.skills.prompt_header')];
    for (const skill of skills) {
      const tagText = skill.tags.length > 0 ? ` [${skill.tags.join(', ')}]` : '';
      lines.push(`- **${skill.name}**${tagText}: ${skill.description}`);
    }
    lines.push(localization.t('agents.skills.prompt_footer'));
    return lines.join('\n');
  }
}

module.exports = SkillService;
