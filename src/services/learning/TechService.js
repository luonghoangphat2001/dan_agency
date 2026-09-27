'use strict';

const XLSX = require('xlsx');
const { parseJson } = require('@services/learning/ContentNormalizer');
const SkillService = require('@services/agent/skills/SkillService');
const localization = require('@lang');

/**
 * Service for Tech Learning management, AI Question Generation, and Mock Interviews.
 * Engine / Runtime delegating prompts and evaluation logic to OpenClaw Skills.
 */
class TechService {
  /** @type {import('../models/TechRepository')} */
  #techRepo;
  /** @type {import('./AIService')} */
  #aiService;
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;
  /** @type {import('@services/agent/skills/SkillService')} */
  #skillService;

  /**
   * @param {import('../models/TechRepository')} techRepo
   * @param {import('./AIService')} aiService
   * @param {import('../models/ConfigRepository')} configRepo
   * @param {import('@services/agent/skills/SkillService')} [skillService]
   */
  constructor(techRepo, aiService, configRepo, skillService = null) {
    this.#techRepo = techRepo;
    this.#aiService = aiService;
    this.#configRepo = configRepo;
    this.#skillService = skillService || aiService?.getSkillService?.() || new SkillService();
  }

  /**
   * Resolves the technical interview skill.
   * @private
   */
  async #getSkill(name = 'learning-tech-question') {
    return this.#skillService.getSkill(name);
  }

  /**
   * Smart Self-Healing JSON Extractor & Parser.
   * @private
   * @param {string} text
   */
  #parseAIJson(text) {
    const raw = String(text || '').trim().replace(/^\uFEFF/, '');
    const structured = parseJson(raw);
    if (structured !== null) return structured;

    throw new Error(localization.t('learning.validation.ai_parse_failed', { message: 'Invalid JSON format' }));
  }

  /**
   * Generate a single technical interview question via AI.
   * @param {{
   *   stackSlug: string,
   *   level?: string,
   *   topicName?: string,
   *   customPrompt?: string,
   *   model?: string|null
   * }} opts
   */
  async generateQuestionWithAI({ stackSlug, level = 'junior', topicName = '', customPrompt = '', model = null }) {
    const stack = await this.#techRepo.findStackBySlug(stackSlug);
    if (!stack) throw new Error(localization.t('learning.validation.tech_stack_not_found', { slug: stackSlug }));

    const skill = await this.#getSkill('learning-tech-question');
    const sections = skill?.sections || {};

    const systemPromptTemplate = sections.single_question_system_prompt || sections.system_prompt || '';
    const systemPrompt = this.#skillService.renderTemplate(systemPromptTemplate, {
      stackName: stack.name,
      level: level || 'junior',
      topicName: topicName || 'Kiến thức cốt lõi',
    });

    const userPromptTemplate = customPrompt
      ? (sections.single_question_custom_user_prompt || sections.custom_user_prompt || '')
      : (sections.single_question_user_prompt || sections.user_prompt || '');

    const userPrompt = this.#skillService.renderTemplate(userPromptTemplate, {
      stackName: stack.name,
      customPrompt,
      level: level || 'junior',
      topicName: topicName || 'Core concepts & Best practices',
    });

    const rawResponse = await this.#aiService.chatOnce(
      [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      model
    );

    const parsed = this.#parseAIJson(rawResponse);
    return {
      stackId: stack.id,
      stackSlug: stack.slug,
      stackName: stack.name,
      title: parsed.title || 'Câu hỏi kỹ thuật',
      question: parsed.question || '',
      quickAnswer: parsed.quick_answer || parsed.quickAnswer || '',
      detailedAnswer: parsed.detailed_answer || parsed.detailedAnswer || '',
      codeExample: parsed.code_example || parsed.codeExample || '',
      interviewTips: parsed.interview_tips || parsed.interviewTips || '',
      practicalTips: parsed.practical_tips || parsed.practicalTips || '',
      level: parsed.level || level,
      tags: parsed.tags || stack.slug,
      topicName: parsed.topic_name || topicName || '',
    };
  }

  /**
   * Batch generate N questions for a stack and module to fill up the question bank.
   * @param {{
   *   stackSlug: string,
   *   level?: string,
   *   topicName?: string,
   *   count?: number,
   *   model?: string|null
   * }} opts
   */
  async batchGenerateWithAI({ stackSlug, level = 'junior', topicName = '', count = 3, model = null }) {
    const stack = await this.#techRepo.findStackBySlug(stackSlug);
    if (!stack) throw new Error(localization.t('learning.validation.tech_stack_not_found', { slug: stackSlug }));

    const existingRows = await this.#techRepo.findExistingTitlesByStack(stack.id);
    const existingTitles = existingRows.map((r) => `- ${r.title}`).slice(0, 30).join('\n');

    const num = Math.min(Math.max(Number(count || 3), 1), 10);

    const skill = await this.#getSkill('learning-tech-question');
    const sections = skill?.sections || {};

    const systemPromptTemplate = sections.batch_system_prompt || sections.system_prompt || '';
    const systemPrompt = this.#skillService.renderTemplate(systemPromptTemplate, {
      count: num,
      stackName: stack.name,
      existingTitles: existingTitles || '(Chưa có câu hỏi nào)',
      level,
      topicName: topicName || 'Chuyên đề kỹ thuật',
    });

    const userPromptTemplate = sections.batch_user_prompt || sections.user_prompt || '';
    const userPrompt = this.#skillService.renderTemplate(userPromptTemplate, {
      count: num,
      stackName: stack.name,
      level,
      topicName: topicName || 'Core & Advanced',
    });

    const rawResponse = await this.#aiService.chatOnce(
      [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      model
    );

    const list = this.#parseAIJson(rawResponse);
    if (!Array.isArray(list)) throw new Error(localization.t('learning.validation.ai_not_array'));

    return list.map((parsed) => ({
      stackId: stack.id,
      stackSlug: stack.slug,
      stackName: stack.name,
      title: parsed.title || 'Câu hỏi kỹ thuật',
      question: parsed.question || '',
      quickAnswer: parsed.quick_answer || parsed.quickAnswer || '',
      detailedAnswer: parsed.detailed_answer || parsed.detailedAnswer || '',
      codeExample: parsed.code_example || parsed.codeExample || '',
      interviewTips: parsed.interview_tips || parsed.interviewTips || '',
      practicalTips: parsed.practical_tips || parsed.practicalTips || '',
      level: parsed.level || level,
      tags: parsed.tags || stack.slug,
      topicName: parsed.topic_name || topicName || '',
    }));
  }

  /**
   * Evaluate a user's answer in a Mock Interview scenario.
   * @param {{
   *   questionId: number,
   *   userAnswer: string,
   *   model?: string|null
   * }} opts
   */
  async evaluateMockInterview({ questionId, userAnswer, model = null }) {
    const question = await this.#techRepo.findQuestionById(questionId);
    if (!question) throw new Error(localization.t('learning.validation.question_not_found', { questionId }));

    const skill = await this.#getSkill('learning-tech-question');
    const sections = skill?.sections || {};

    const promptTemplate = sections.mock_interview_evaluation_prompt || sections.evaluation_prompt || '';
    const prompt = this.#skillService.renderTemplate(promptTemplate, {
      stackName: question.stack_name,
      question: question.question,
      quickAnswer: question.quick_answer,
      detailedAnswer: question.detailed_answer,
      interviewTips: question.interview_tips || 'N/A',
      userAnswer,
    });

    const rawResponse = await this.#aiService.chatOnce(
      [{ role: 'user', content: prompt }],
      model
    );

    return this.#parseAIJson(rawResponse);
  }

  /**
   * Import questions from uploaded Excel buffer.
   * @param {Buffer} buffer
   * @param {string} defaultStackSlug
   */
  async importQuestionsFromExcel(buffer, defaultStackSlug = 'php') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      throw new Error('File Excel rỗng hoặc không đúng định dạng');
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.length) continue;

      try {
        const stackSlug = (row[0] ? String(row[0]) : defaultStackSlug).toLowerCase().trim();
        const stack = await this.#techRepo.findStackBySlug(stackSlug);
        if (!stack) {
          errors.push(`Dòng ${i + 1}: Không tìm thấy Tech "${stackSlug}"`);
          continue;
        }

        const title = row[1] ? String(row[1]).trim() : '';
        const question = row[2] ? String(row[2]).trim() : title;
        const quickAnswer = row[3] ? String(row[3]).trim() : '';
        const detailedAnswer = row[4] ? String(row[4]).trim() : quickAnswer;
        const codeExample = row[5] ? String(row[5]).trim() : '';
        const interviewTips = row[6] ? String(row[6]).trim() : '';
        const practicalTips = row[7] ? String(row[7]).trim() : '';
        const level = (row[8] ? String(row[8]).toLowerCase().trim() : 'junior');
        const tags = row[9] ? String(row[9]).trim() : stack.slug;
        const topicName = row[10] ? String(row[10]).trim() : '';

        if (!title || !quickAnswer) {
          errors.push(`Dòng ${i + 1}: Thiếu Tiêu đề hoặc Trả lời nhanh`);
          continue;
        }

        let topicId = null;
        if (topicName) {
          const topic = await this.#techRepo.findOrCreateTopic(stack.id, topicName);
          topicId = topic.id;
        }

        const result = await this.#techRepo.upsertQuestion({
          stackId: stack.id,
          topicId,
          title,
          question,
          quickAnswer,
          detailedAnswer,
          codeExample,
          interviewTips,
          practicalTips,
          level: ['fresher', 'junior', 'mid', 'senior'].includes(level) ? level : 'junior',
          tags,
          createdBy: 'excel_import',
        });

        if (result.action === 'created') created++;
        else updated++;
      } catch (err) {
        errors.push(`Dòng ${i + 1}: ${err.message}`);
      }
    }

    return { ok: true, created, updated, errors };
  }

  /**
   * Export questions to an Excel buffer.
   * @param {string|null} [stackSlug]
   */
  async exportQuestionsToExcel(stackSlug = null) {
    const questions = await this.#techRepo.findQuestions({
      stackSlug: stackSlug || undefined,
      limit: 1000,
      includeInactive: true,
    });

    const data = questions.map((q, idx) => ({
      [localization.t('learning.excel_export.index')]: idx + 1,
      [localization.t('learning.excel_export.stack')]: q.stack_slug,
      [localization.t('learning.excel_export.topic')]: q.topic_name || '',
      [localization.t('learning.excel_export.level')]: q.level,
      [localization.t('learning.excel_export.title')]: q.title,
      [localization.t('learning.excel_export.question')]: q.question,
      [localization.t('learning.excel_export.quick_answer')]: q.quick_answer,
      [localization.t('learning.excel_export.detailed_answer')]: q.detailed_answer,
      [localization.t('learning.excel_export.code_example')]: q.code_example || '',
      [localization.t('learning.excel_export.interview_tips')]: q.interview_tips || '',
      [localization.t('learning.excel_export.practical_tips')]: q.practical_tips || '',
      [localization.t('learning.excel_export.tags')]: q.tags || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tech Questions');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Seed curated high-yield initial questions for all 6 stacks if question table is empty.
   */
  async seedInitialBankIfEmpty() {
    const existing = await this.#techRepo.findQuestions({ limit: 1 });
    if (existing.length > 0) return;

    const initialSeeds = require('@database/seeders/content/data/initial_tech_questions.json');

    for (const item of initialSeeds) {
      const stack = await this.#techRepo.findStackBySlug(item.stackSlug);
      if (!stack) continue;

      let topicId = null;
      if (item.topicName) {
        const topic = await this.#techRepo.findOrCreateTopic(stack.id, item.topicName);
        topicId = topic.id;
      }

      await this.#techRepo.createQuestion({
        stackId: stack.id,
        topicId,
        title: item.title,
        question: item.question,
        quickAnswer: item.quickAnswer,
        detailedAnswer: item.detailedAnswer,
        codeExample: item.codeExample,
        interviewTips: item.interviewTips,
        practicalTips: item.practicalTips,
        level: item.level,
        tags: item.tags,
        createdBy: 'seed',
      });
    }
  }
}

module.exports = TechService;
