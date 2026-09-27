'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for dynamically loading specialized SKILL.md SOPs during ReAct reasoning.
 */
class SkillLoaderTool extends BaseTool {
  /** @type {import('@services/agent/skills/SkillService')} */
  #skillService;

  /**
   * @param {import('@services/agent/skills/SkillService')} skillService
   */
  constructor(skillService) {
    const schema = z.object({
      skillName: z.string().min(1).describe(
        localization.t('agent.tools.skill_loader.schema_skill_name')
      )
    });

    super(
      'skill_loader',
      localization.t('agent.tools.skill_loader.description'),
      schema
    );

    this.#skillService = skillService;
  }

  async execute(parameters, context = {}) {
    if (!this.#skillService) {
      return {
        success: false,
        error: localization.t('agent.errors.service_unavailable', { serviceName: 'SkillService' })
      };
    }

    const { skillName } = parameters;
    const skill = this.#skillService.getSkill(skillName);

    if (!skill) {
      const availableSkills = this.#skillService.listSkills().map((s) => s.name);
      return {
        success: false,
        error: localization.t('agent.tools.skill_loader.error_skill_not_found', { skillName }),
        availableSkills
      };
    }

    if (!skill.content || skill.content.trim().length === 0) {
      return {
        success: false,
        error: localization.t('agent.tools.skill_loader.error_skill_empty', { skillName })
      };
    }

    return {
      success: true,
      skillName: skill.name,
      version: skill.version,
      author: skill.author,
      description: skill.description,
      tags: skill.tags,
      instructions: skill.content
    };
  }
}

module.exports = SkillLoaderTool;
