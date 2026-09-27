'use strict';

const SkillService = require('@services/agent/skills/SkillService');
const SkillLoaderTool = require('@services/agent/tools/SkillLoaderTool');

describe('SkillService & SkillLoaderTool', () => {
  let skillService;

  beforeEach(() => {
    skillService = new SkillService();
  });

  test('should discover and load installed skills', () => {
    const skills = skillService.listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(1);

    const codeReview = skills.find((s) => s.name === 'code-review');
    expect(codeReview).toBeDefined();
    expect(codeReview.version).toBe('1.0.0');
    expect(codeReview.tags).toContain('review');
  });

  test('should retrieve specific skill with markdown body', () => {
    const skill = skillService.getSkill('code-review');
    expect(skill).not.toBeNull();
    expect(skill.content).toContain('SOP: Quy Trình Code Review Chuyên Nghiệp');
  });

  test('should search skills by keyword', () => {
    const results = skillService.searchSkills('security');
    expect(results.some((s) => s.name === 'code-review')).toBe(true);
  });

  test('should format skills summary for system prompt', () => {
    const formatted = skillService.formatSkillsForPrompt();
    expect(formatted).toContain('CÁC KỸ NĂNG NGHIỆP VỤ (SKILLS) KHẢ DỤNG');
    expect(formatted).toContain('code-review');
  });

  test('SkillLoaderTool should successfully return skill SOP', async () => {
    const tool = new SkillLoaderTool(skillService);
    const result = await tool.execute({ skillName: 'code-review' });

    expect(result.success).toBe(true);
    expect(result.skillName).toBe('code-review');
    expect(result.instructions).toContain('Mục Tiêu');
  });

  test('SkillLoaderTool should handle non-existent skill gracefully', async () => {
    const tool = new SkillLoaderTool(skillService);
    const result = await tool.execute({ skillName: 'unknown-skill-xyz' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('unknown-skill-xyz');
    expect(Array.isArray(result.availableSkills)).toBe(true);
  });
});
