'use strict';

const XLSX = require('xlsx');
const { parseJson, unpackItems, normalizeItem } = require('@services/learning/ContentNormalizer');
const { performanceMap, weightedShuffle } = require('@services/learning/AdaptiveSelector');
const SkillService = require('@services/agent/skills/SkillService');
const LearningType = require('@enums/learning-type.enum');
const localization = require('@lang');

/**
 * Unified Learning Service for Tech Stacks and English Modules.
 * Engine / Runtime delegating domain instructions and schemas to OpenClaw Skills.
 */
class LearningService {
  /** @type {import('../models/LearningRepository')} */
  #learningRepo;

  /** @type {import('./AIService')} */
  #aiService;

  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /** @type {import('@services/agent/skills/SkillService')} */
  #skillService;

  /** @type {import('discord.js').Client|null} */
  #discordClient = null;

  constructor(learningRepo, aiService, configRepo, skillService = null) {
    this.#learningRepo = learningRepo;
    this.#aiService = aiService;
    this.#configRepo = configRepo;
    this.#skillService = skillService || aiService?.getSkillService?.() || new SkillService();
  }

  setDiscordClient(client) {
    this.#discordClient = client;
  }

  #log(event, context = {}) {
    console.log(`[Learning] ${JSON.stringify({ event, source: 'learning', ...context })}`);
  }

  /**
   * Resolves the appropriate OpenClaw skill for content generation.
   * @param {string} targetType
   * @returns {object|null}
   */
  #resolveLearningSkill(targetType) {
    if (!targetType) return this.#skillService.getSkill('learning-vocabulary');
    const normalized = String(targetType).trim();
    return this.#skillService.getSkill(`learning-${normalized.replace(/_/g, '-')}`)
      || this.#skillService.getSkill(`learning-${normalized}`)
      || this.#skillService.getSkill(normalized)
      || this.#skillService.getSkill('learning-vocabulary');
  }

  /**
   * Resolves the appropriate OpenClaw skill for submission evaluation.
   * @param {string} type
   * @returns {object|null}
   */
  #resolveEvaluationSkill(type) {
    if (!type) return this.#skillService.getSkill('learning-evaluation-default');
    const normalized = String(type).trim();
    return this.#skillService.getSkill(`learning-${normalized.replace(/_/g, '-')}`)
      || this.#skillService.getSkill(`learning-${normalized}`)
      || this.#skillService.getSkill(normalized)
      || this.#skillService.getSkill('learning-evaluation-default');
  }

  /**
   * Builds system and user prompts dynamically from the resolved OpenClaw skill.
   * @param {object} skill
   * @param {Record<string, any>} vars
   * @param {string|null} customConfigPrompt
   * @returns {{ system: string, user: string }}
   */
  #buildGenerationPrompts(skill, vars, customConfigPrompt) {
    let system = '';
    let user = '';
    const sections = skill?.sections || {};

    if (customConfigPrompt && customConfigPrompt.trim()) {
      system = this.#skillService.renderTemplate(customConfigPrompt, vars);
      user = vars.customPrompt
        ? `Tạo ${vars.count} nội dung theo yêu cầu: "${vars.customPrompt}". Cấp độ: ${vars.level}.`
        : `Tạo ${vars.count} nội dung cho ${vars.topicName || vars.stackName}, cấp độ: ${vars.level}.`;
    } else {
      const systemTemplate = sections.system_prompt || skill?.content || '';
      system = this.#skillService.renderTemplate(systemTemplate, {
        ...vars,
        stackNameLower: (vars.stackName || '').toLowerCase(),
        topicNameLower: (vars.topicName || '').toLowerCase(),
        deduplicationNote: vars.existingWords ? `LƯU Ý: KHÔNG ĐƯỢC sinh trùng các từ sau: [${vars.existingWords}]` : '',
      });

      if (vars.customPrompt) {
        const customUserTemplate = sections.custom_user_prompt || sections.user_prompt || '';
        user = this.#skillService.renderTemplate(customUserTemplate, vars);
      } else {
        const userTemplate = sections.user_prompt || '';
        user = this.#skillService.renderTemplate(userTemplate, vars);
      }
    }

    if (sections.constraints) {
      const renderedConstraints = this.#skillService.renderTemplate(sections.constraints, vars);
      if (renderedConstraints) {
        system += `\n\n${renderedConstraints}`;
      }
    }

    return { system, user };
  }

  /**
   * Builds evaluation prompt dynamically from the resolved OpenClaw skill.
   * @param {object} skill
   * @param {object} item
   * @param {string} userSubmission
   * @param {string|null} customConfigPrompt
   * @returns {string}
   */
  #buildEvaluationPrompt(skill, item, userSubmission, customConfigPrompt) {
    if (customConfigPrompt && customConfigPrompt.trim()) {
      const vars = {
        title: item.title,
        prompt: item.prompt || '',
        detailedAnswer: item.content?.detailed_answer || '',
        submission: userSubmission,
      };
      return this.#skillService.renderTemplate(customConfigPrompt, vars);
    }

    const template = skill?.sections?.evaluation_prompt || skill?.content || '';
    const content = item.content || {};
    const questions = Array.isArray(content.comprehension_questions)
      ? content.comprehension_questions.join('\n')
      : (Array.isArray(content.guiding_questions) ? content.guiding_questions.join('\n') : (content.questions ? JSON.stringify(content.questions) : ''));
    const model = item.sample_solution?.model_answer || '';

    const vars = {
      title: item.title,
      prompt: item.prompt || '',
      detailedAnswer: item.content?.detailed_answer || '',
      submission: userSubmission,
      questions,
      modelAnswer: model,
      model,
    };
    return this.#skillService.renderTemplate(template, vars);
  }

  // ─── 1. UNIVERSAL AI CONTENT GENERATOR ───────────────────────
  async generateAIContent(params) {
    return this.generateContent({
      ...params,
      category: params.category || params.categorySlug,
      learning: params.learning || params.learningSlug || params.learningId,
      topic_no: params.topic_no || params.topicNo,
    });
  }

  async evaluateAISubmission(params) {
    return this.evaluateSubmission({
      ...params,
      item_id: params.item_id || params.itemId,
      user_submission: params.user_submission || params.submission || params.userSubmission,
    });
  }

  async generateContent({ category, type, learning, topic_no, level = 'junior', count = 5, prompt: customPrompt, model }) {
    // Keep the generator batch bounded for provider stability while allowing
    // the UI's supported presets: 5, 10, 20, and 30 items.
    const targetCount = Math.max(1, Math.min(parseInt(count, 10) || 5, 30));
    // Keep each response small enough for providers with a 1K-token limit.
    // Larger presets are assembled from several short, valid JSON batches.
    const batchSize = Math.min(targetCount, 3);
    const targetLevel = level || 'junior';
    const targetType = category === 'tech' ? LearningType.TECH_QUESTION : (type || LearningType.VOCABULARY);
    this.#log('generate_start', {
      category: category || null,
      type: targetType,
      learning: learning || null,
      topicNo: topic_no || null,
      level: targetLevel,
      count: targetCount,
    });

    let targetLearning = null;
    if (learning) {
      targetLearning = /^\d+$/.test(learning)
        ? await this.#learningRepo.findLearningById(Number(learning))
        : await this.#learningRepo.findLearningBySlug(String(learning));
    }
    if (!targetLearning && topic_no && category === 'english') {
      targetLearning = await this.#learningRepo.findLearningBySlug(`vocab-topic-${topic_no}`);
    }

    // Deduplication check for vocabulary
    let existingWords = [];
    if (targetType === 'vocabulary' && targetLearning) {
      const items = await this.#learningRepo.findItems({ learningId: targetLearning.id, type: 'vocabulary', limit: 300 });
      existingWords = items.map((i) => i.title.toLowerCase().trim());
    }

    const configKeyMap = {
      tech_question: 'learning_prompt_tech',
      vocabulary: 'learning_prompt_vocab',
      quiz: 'learning_prompt_quiz',
      reading: 'learning_prompt_reading',
      writing: 'learning_prompt_writing',
      speaking: 'learning_prompt_speaking',
      ielts: 'learning_prompt_ielts',
    };

    const customConfigPrompt = this.#configRepo.get(configKeyMap[targetType] || '')
      || (targetType === 'reading' ? this.#configRepo.get('learning_prompt_rw') : '');
    const vars = {
      stackName: targetLearning?.name || 'Web Engineering',
      topicName: targetLearning?.name || `Topic ${topic_no || 1}`,
      level: targetLevel,
      count: batchSize,
      customPrompt: customPrompt || '',
      existingWords: existingWords.slice(0, 50).join(', '),
    };

    const skill = this.#resolveLearningSkill(targetType);
    const { system, user } = this.#buildGenerationPrompts(skill, vars, customConfigPrompt);

    const normalizeBatch = (parsed) => unpackItems(Array.isArray(parsed) ? parsed : [parsed])
      .map((item) => normalizeItem(item, { level: targetLevel }));
    const uniqueByTitle = (items) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = item.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    let items = normalizeBatch(this.#parseAIJson(
      await this.#aiService.chatOnce([{ role: 'user', content: `${system}\n\n${user}` }], model, 'learning')
    ));

    // Some providers return one object even when asked for an array. Ask for
    // the missing remainder instead of rendering a misleading one-item batch.
    const maxAttempts = Math.ceil(targetCount / batchSize) + 2;
    for (let attempt = 0; items.length < targetCount && attempt < maxAttempts; attempt++) {
      const remaining = Math.min(batchSize, targetCount - items.length);
      const existingTitles = items.map((item) => item.title).join(', ');
      const retryPrompt = `${user}\n\nBạn mới trả về ${items.length} item. Hãy tạo đúng ${remaining} item còn thiếu, chỉ trả về JSON ARRAY. Không lặp lại các tiêu đề: ${existingTitles}`;
      const retry = this.#parseAIJson(
        await this.#aiService.chatOnce([{ role: 'user', content: `${system}\n\n${retryPrompt}` }], model, 'learning')
      );
      items = uniqueByTitle([...items, ...normalizeBatch(retry)]);
    }

    items = uniqueByTitle(items);

    this.#log('generate_success', {
      type: targetType,
      learningId: targetLearning?.id || null,
      itemCount: items.length,
      requestedCount: targetCount,
    });

    return {
      learningId: targetLearning?.id || null,
      learningSlug: targetLearning?.slug || null,
      learningName: targetLearning?.name || 'General',
      type: targetType,
      items,
    };
  }

  async saveAIBatch({ learningId, type, items }) {
    const normalized = unpackItems(items);
    const itemType = type || (normalized[0] && normalized[0].type) || 'vocabulary';

    let targetLearningId = Number(learningId);
    let targetLearning = await this.#learningRepo.findLearningById(targetLearningId);

    if (itemType === 'reading') {
      if (!targetLearning || targetLearning.type !== 'reading') {
        const rLearning = await this.#learningRepo.findLearningBySlug('english-reading')
          || await this.#learningRepo.findLearningBySlug('english-rw');
        if (rLearning) targetLearningId = rLearning.id;
      }
    } else if (itemType === 'writing') {
      if (!targetLearning || targetLearning.type !== 'writing') {
        const wLearning = await this.#learningRepo.findLearningBySlug('english-writing');
        if (wLearning) targetLearningId = wLearning.id;
      }
    } else if (itemType === 'speaking') {
      if (!targetLearning || targetLearning.type !== 'speaking') {
        const spLearning = await this.#learningRepo.findLearningBySlug('english-speaking');
        if (spLearning) targetLearningId = spLearning.id;
      }
    } else if (itemType === 'ielts') {
      if (!targetLearning || targetLearning.type !== 'ielts') {
        const ieltsLearning = await this.#learningRepo.findLearningBySlug('english-ielts');
        if (ieltsLearning) targetLearningId = ieltsLearning.id;
      }
    }

    this.#log('save_batch_start', { learningId: targetLearningId, type: itemType, itemCount: normalized.length });
    const ids = [];
    for (const item of normalized) {
      ids.push(await this.#learningRepo.createItem({
        learningId: targetLearningId,
        type: itemType,
        title: item.title,
        prompt: item.prompt,
        level: item.level,
        content: item.content,
        sampleSolution: item.sample_solution,
        tags: item.tags,
        createdBy: 'ai',
      }));
    }
    this.#log('save_batch_success', { learningId: targetLearningId, type: itemType, itemCount: ids.length });
    return { count: ids.length, ids };
  }

  // ─── 2. UNIVERSAL AI EVALUATOR ───────────────────────────────
  async evaluateSubmission({ item_id, type, user_submission, username = 'learner', model }) {
    this.#log('evaluate_start', { itemId: item_id, type: type || null, username });
    const item = await this.#learningRepo.findItemById(item_id);
    if (!item) throw new Error(`Item #${item_id} not found`);

    const evalKeyMap = {
      tech_question: 'learning_prompt_eval_tech',
      ielts: 'learning_prompt_eval_ielts',
      writing: 'learning_prompt_eval_ielts',
      reading: 'learning_prompt_eval_rw',
      speaking: 'learning_prompt_eval_speaking',
    };
    const customConfigPrompt = this.#configRepo.get(evalKeyMap[type] || '');

    const evalSkill = this.#resolveEvaluationSkill(type);
    const prompt = this.#buildEvaluationPrompt(evalSkill, item, user_submission, customConfigPrompt);

    const raw = await this.#aiService.chatOnce([{ role: 'user', content: prompt }], model, 'learning');
    const feedback = this.#parseAIJson(raw);
    const finalScore = feedback.score || feedback.overall_band || 7.0;

    await this.#learningRepo.upsertMetadata(item.id, username, {
      metaKey: 'evaluation',
      status: finalScore >= 7 ? 'mastered' : 'studying',
      score: finalScore,
      userSubmission: user_submission,
      aiFeedback: feedback,
    });

    this.#log('evaluate_success', { itemId: item.id, type: type || null, username, score: finalScore });

    return {
      itemId: item.id,
      score: finalScore,
      feedback,
    };
  }

  // ─── 3. VOCABULARY QUIZ ENGINE (DB-Driven) ────────────────────
  async generateQuizSession(opts = {}) {
    const limit = Math.max(3, Math.min(opts.count || 5, 50));
    this.#log('quiz_generate_start', { count: limit, topicNo: opts.topicNo || null, mode: opts.mode || 'multiple_choice' });
    const words = await this.#learningRepo.findItems({
      type: 'vocabulary',
      ...(opts.topicNo ? { topicNo: opts.topicNo } : {}),
      ...(opts.level ? { level: opts.level } : {}),
      // Load the complete 50-topic bank (repository cap: 1000) before the
      // adaptive shuffle. A 100-row window could silently restrict an exam
      // to only the first few topics.
      limit: 1000,
    });

    if (words.length < 3) {
      this.#log('quiz_generate_failed', { reason: 'insufficient_vocabulary', available: words.length, required: 3 });
      throw new Error(localization.t('learning.validation.insufficient_vocab'));
    }

    const history = opts.userId && typeof this.#learningRepo.getItemPerformance === 'function'
      ? await this.#learningRepo.getItemPerformance(opts.userId, words.map((word) => word.id))
      : [];
    const selected = weightedShuffle(words, performanceMap(history)).slice(0, limit);
    const optionLetters = ['A', 'B', 'C', 'D'];

    const questions = selected.map((item, idx) => {
      const c = item.content || {};
      const meaning = c.meaning || item.title;
      const otherMeanings = words
        .filter((w) => w.id !== item.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.content?.meaning || w.title);

      const options = [meaning, ...otherMeanings].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(meaning);

      return {
        id: item.id,
        index: idx + 1,
        word: item.title,
        pronunciation: c.pronunciation || '',
        example: c.example || '',
        note: c.note || '',
        level: item.level || 'beginner',
        options: options.map((opt, i) => `${optionLetters[i]}. ${opt}`),
        correct_option: optionLetters[correctIdx >= 0 ? correctIdx : 0],
        correct_meaning: meaning,
      };
    });

    const result = {
      total: questions.length,
      mode: opts.mode || 'multiple_choice',
      topicNo: opts.topicNo || null,
      questions,
    };
    this.#log('quiz_generate_success', { total: result.total, topicNo: result.topicNo, mode: result.mode });
    return result;
  }

  // Backward-compatible name used by the LearningController and older UI.
  async buildQuizFromVocab(opts = {}) {
    return this.generateQuizSession(opts);
  }

  async recordQuizScore(username, score, total, details = {}, userId = username) {
    const items = await this.#learningRepo.findItems({ type: 'vocabulary', limit: 1 });
    const itemId = items[0]?.id || 1;
    const numericScore = Number(((score / total) * 10).toFixed(1));
    this.#log('quiz_score_start', { username, score: Number(score), total: Number(total), normalizedScore: numericScore });
    const userSubmission = JSON.stringify({
      score: Number(score),
      total: Number(total),
      date: new Date().toISOString(),
    });

    if (typeof this.#learningRepo.insertQuizResult === 'function') {
      await this.#learningRepo.insertQuizResult(itemId, username, {
        score: numericScore,
        userSubmission,
        aiFeedback: details,
      });
    } else {
      // Compatibility for older repository adapters during rolling deploys.
      await this.#learningRepo.upsertMetadata(itemId, username, {
        metaKey: 'quiz_result',
        score: numericScore,
        userSubmission,
        aiFeedback: details,
      });
    }

    const attempts = Array.isArray(details?.attempts) ? details.attempts : [];
    const recorded = typeof this.#learningRepo.recordItemAttempts === 'function'
      ? await this.#learningRepo.recordItemAttempts(userId, username, 'vocabulary', attempts)
      : 0;

    this.#log('quiz_score_success', {
      username,
      score: Number(score),
      total: Number(total),
      normalizedScore: numericScore,
      itemId,
      attemptsRecorded: recorded,
    });
    return { ok: true, score, total, attemptsRecorded: recorded };
  }

  async recordPracticeExamAttempts(userId, username, attempts = []) {
    if (typeof this.#learningRepo.recordItemAttempts !== 'function') return 0;
    return this.#learningRepo.recordItemAttempts(userId, username, 'practice_exam', attempts);
  }

  /**
   * Get learning history with pagination and account summary.
   * @param {{ userId?: string, username?: string, isAdmin?: boolean, query?: object }} opts
   */
  async getLearningHistory({ userId, username, isAdmin = false, query = {} }) {
    const targetUserId = isAdmin && (query.userId || query.user_id)
      ? String(query.userId || query.user_id)
      : (isAdmin && (query.all === '1' || query.all === 'true') ? undefined : String(userId || username || ''));

    const targetUsername = isAdmin && query.username
      ? String(query.username)
      : (isAdmin && (query.userId || query.user_id || query.all === '1' || query.all === 'true') ? undefined : String(username || ''));

    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const page = Math.max(1, Number(query.page || 1));
    const offset = query.offset !== undefined ? Math.max(0, Number(query.offset)) : (page - 1) * limit;

    const filters = {
      userId: targetUserId,
      username: targetUsername,
      quizType: query.quiz_type || query.type,
      isCorrect: query.is_correct !== undefined ? query.is_correct : query.correct,
      learningSlug: query.learning || query.learning_slug,
      categorySlug: query.category || query.category_slug,
      search: query.search,
      startDate: query.start_date || query.startDate,
      endDate: query.end_date || query.endDate,
      limit,
      offset,
    };

    const [history, total, summary] = await Promise.all([
      typeof this.#learningRepo.findLearningHistory === 'function'
        ? this.#learningRepo.findLearningHistory(filters)
        : [],
      typeof this.#learningRepo.countLearningHistory === 'function'
        ? this.#learningRepo.countLearningHistory(filters)
        : 0,
      typeof this.#learningRepo.getUserLearningSummary === 'function'
        ? this.#learningRepo.getUserLearningSummary(targetUserId || userId, targetUsername || username)
        : null,
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      history,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        totalPages,
      },
      summary,
    };
  }

  /**
   * Get learning statistics summary for a user.
   * @param {{ userId?: string, username?: string }} opts
   */
  async getUserLearningStats({ userId, username }) {
    if (typeof this.#learningRepo.getUserLearningSummary === 'function') {
      return this.#learningRepo.getUserLearningSummary(userId, username);
    }
    return null;
  }

  // ─── 4. SELECTIVE DISCORD NOTIFICATIONS ──────────────────────
  getConfig() {
    const rawVocabEnabled = this.#configRepo.get('vocab_enabled');
    const rawNotifyEnabled = this.#configRepo.get('notify_vocab_enabled');
    const vocabEnabled = rawVocabEnabled !== null
      ? (rawVocabEnabled === 'true' || rawNotifyEnabled === 'true')
      : (rawNotifyEnabled !== 'false');

    return {
      notify_vocab_enabled: vocabEnabled,
      notify_tech_enabled: this.#configRepo.get('notify_tech_enabled') === 'true',
      notify_quiz_enabled: this.#configRepo.get('notify_quiz_enabled') === 'true',
      notify_ielts_enabled: this.#configRepo.get('notify_ielts_enabled') === 'true',
      daily_time: this.#configRepo.get('vocab_daily_time') || '08:00',
      words_per_day: Number(this.#configRepo.get('vocab_words_per_day') || 5),
      discord_channel_id: this.#configRepo.get('vocab_discord_channel_id') || this.#configRepo.get('schedule_discord_channel_id') || '',
      current_topic_no: Number(this.#configRepo.get('vocab_current_topic_no') || 1),
    };
  }

  async updateConfig(data) {
    const keys = [
      'notify_vocab_enabled', 'notify_tech_enabled', 'notify_quiz_enabled', 'notify_ielts_enabled',
      'vocab_daily_time', 'vocab_words_per_day', 'vocab_discord_channel_id', 'vocab_current_topic_no'
    ];
    for (const k of keys) {
      if (data[k] !== undefined) {
        await this.#configRepo.set(k, String(data[k]));
        if (k === 'notify_vocab_enabled') {
          await this.#configRepo.set('vocab_enabled', String(data[k]));
        }
      }
    }
  }

  async #buildDiscordMessage(item) {
    const skill = await this.#resolveLearningSkill({ type: item.type, category: item.category });
    const template = skill?.sections?.discord_template;
    if (template) {
      const codeLang = item.tags?.includes('php') ? 'php' : 'javascript';
      const vars = {
        title: item.title || '',
        titleUpper: (item.title || '').toUpperCase(),
        pronunciation: item.content?.pronunciation ? `\`/${item.content.pronunciation.replace(/^\/|\/$/g, '')}/\`` : '',
        meaning: item.content?.meaning || '',
        exampleLine: item.content?.example ? `📝 **Ví dụ:** *"${item.content.example}"*` : '',
        noteLine: item.content?.note ? `💬 **Dịch nghĩa:** ${item.content.note}` : '',
        collocationsLine: item.content?.collocations ? `🔗 **Collocations:** ${Array.isArray(item.content.collocations) ? item.content.collocations.join(', ') : item.content.collocations}` : '',
        promptLine: item.prompt ? `❓ **Đề bài:** ${item.prompt}` : '',
        quickAnswerLine: item.content?.quick_answer ? `⚡ **Trả lời nhanh 30s:**\n${item.content.quick_answer}` : '',
        codeExampleBlock: item.content?.code_example ? `💻 **Code:**\n\`\`\`${codeLang}\n${item.content.code_example}\n\`\`\`` : '',
      };
      return this.#skillService.renderTemplate(template, vars)
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n');
    }

    return [
      `📌 **${item.title}**`,
      item.prompt ? `❓ ${item.prompt}` : null,
      item.content?.meaning ? `💡 ${item.content.meaning}` : null,
      item.content?.quick_answer ? `⚡ ${item.content.quick_answer}` : null,
    ].filter(Boolean).join('\n');
  }

  async sendSingleItemToDiscord(itemId) {
    const item = await this.#learningRepo.findItemById(itemId);
    if (!item) throw new Error(`Item #${itemId} not found`);

    const channelId = this.getConfig().discord_channel_id;
    if (!channelId) throw new Error(localization.t('learning.validation.discord_channel_not_configured'));

    const message = await this.#buildDiscordMessage(item);

    let sent = false;
    if (this.#discordClient) {
      try {
        const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased?.() || channel?.send) {
          console.log(`[Learning] ${JSON.stringify({ event: 'dispatch', source: 'learning', type: 'single_item', itemId: item.id, itemType: item.type, channelId })}`);
          await channel.send(message);
          sent = true;
        }
      } catch (_) { }
    }

    if (!sent) {
      const token = process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN : this.#configRepo.get('discord_token');
      if (token) {
        const discordApiUrl = process.env.DISCORD_API_BASE_URL;
        if (!discordApiUrl) {
          throw new Error('[LearningService] DISCORD_API_BASE_URL is required in environment');
        }
        const res = await fetch(`${discordApiUrl.replace(/\/$/, '')}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: message }),
        });
        if (res.ok) {
          sent = true;
        }
      }
    }

    if (sent) {
      await this.#learningRepo.markItemSent(item.id);
      console.log(`[Learning] ${JSON.stringify({ event: 'sent', source: 'learning', type: 'single_item', itemId: item.id, channelId })}`);
      return { ok: true, message: `Đã gửi item #${item.id} (${item.title}) sang Discord!` };
    }

    throw new Error(localization.t('learning.validation.discord_bot_not_ready'));
  }

  // ─── 5. US IPA PRONUNCIATION AUTO-FETCHER ────────────────────
  async fillMissingPronunciations() {
    const items = await this.#learningRepo.findItems({ type: 'vocabulary', limit: 1000 });
    let updated = 0;
    let failed = 0;
    const batchSize = 10;

    const missing = items.filter((item) => {
      const pronunciation = item.content?.pronunciation;
      return !pronunciation || String(pronunciation).trim() === '';
    });

    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        const ipa = await this.#fetchUSIpa(item.title);
        if (!ipa) {
          failed++;
          return;
        }
        const content = { ...(item.content || {}), pronunciation: ipa };
        await this.#learningRepo.updateItem(item.id, { content });
        updated++;
      }));
    }
    return { total: missing.length, updated, failed };
  }

  async #fetchUSIpa(word) {
    try {
      const dictionaryUrl = process.env.DICTIONARY_API_URL;
      if (!dictionaryUrl) {
        throw new Error('[LearningService] DICTIONARY_API_URL is required in environment');
      }
      const cleanWord = encodeURIComponent(word.toLowerCase().trim().replace(/[^a-z-]/g, ''));
      const res = await fetch(`${dictionaryUrl.replace(/\/$/, '')}/${cleanWord}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const phonetics = Array.isArray(data) ? data[0]?.phonetics || [] : [];
      return (
        phonetics.find((p) => p.audio?.includes('-us.') || p.audio?.includes('/us/'))?.text ||
        phonetics.find((p) => p.text)?.text ||
        data[0]?.phonetic ||
        null
      );
    } catch {
      return null;
    }
  }

  // ─── 6. EXCEL EXPORT & IMPORT (xlsx) ─────────────────────────
  async exportToExcel(learningSlug = null) {
    const targetLearning = learningSlug && learningSlug !== 'all'
      ? await this.#learningRepo.findLearningBySlug(learningSlug)
      : null;

    const items = targetLearning
      ? await this.#learningRepo.findItems({ learningId: targetLearning.id, limit: 1000 })
      : await this.#learningRepo.findItems({ type: LearningType.VOCABULARY, limit: 2000 });

    const isTech = items.some((i) => i.type === LearningType.TECH_QUESTION) || targetLearning?.type === LearningType.TECH_QUESTION;
    const rows = isTech
      ? [
        ['ID', 'Category', 'Stack', 'Title', 'Prompt', 'Level', 'Quick Answer', 'Detailed Answer', 'Code Example', 'Interview Tips', 'Practical Tips', 'Tags'],
        ...items.map((i) => [
          i.id, i.category_name || 'Tech', i.learning_name || 'General', i.title, i.prompt || '', i.level || 'junior',
          i.content?.quick_answer || '', i.content?.detailed_answer || '', i.content?.code_example || '',
          i.content?.interview_tips || '', i.content?.practical_tips || '', i.tags || '',
        ]),
      ]
      : [
        ['ID', 'Category', 'Topic', 'Word / Title', 'Pronunciation', 'Meaning', 'Example', 'Note', 'Status'],
        ...items.map((i) => [
          i.id, i.category_name || 'English', i.learning_name || 'General', i.title,
          i.content?.pronunciation || '', i.content?.meaning || '', i.content?.example || i.prompt || '',
          i.content?.note || '', i.is_sent ? 'Sent' : 'Unsent',
        ]),
      ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Vocabulary Bank');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(learningId, buffer) {
    const learning = await this.#learningRepo.findLearningById(learningId);
    if (!learning) throw new Error(localization.t('learning.validation.learning_not_found', { learningId }));

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error(localization.t('learning.validation.excel_empty'));

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!rows.length) throw new Error(localization.t('learning.validation.excel_no_data'));

    let created = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.length) continue;

      const title = String(r[3] || r[2] || r[1] || '').trim();
      if (!title) continue;

      const isTech = learning.type === LearningType.TECH_QUESTION;
      const content = isTech
        ? {
          quick_answer: String(r[6] || '').trim(),
          detailed_answer: String(r[7] || '').trim(),
          code_example: String(r[8] || '').trim(),
          interview_tips: String(r[9] || '').trim(),
          practical_tips: String(r[10] || '').trim(),
        }
        : {
          meaning: String(r[5] || r[3] || '').trim(),
          pronunciation: String(r[4] || '').trim(),
          example: String(r[6] || r[4] || '').trim(),
          note: String(r[7] || r[5] || '').trim(),
        };

      await this.#learningRepo.createItem({
        learningId: learning.id,
        type: learning.type || 'vocabulary',
        title,
        prompt: isTech ? String(r[4] || '').trim() : String(r[6] || r[4] || '').trim(),
        level: isTech ? String(r[5] || 'junior').trim() : undefined,
        content,
        tags: isTech ? String(r[11] || '').trim() : undefined,
        createdBy: 'import',
      });
      created++;
    }

    return { total: rows.length - 1, created };
  }

  // ─── 7. SMART SELF-HEALING AI JSON PARSER ─────────────────────
  #parseAIJson(text) {
    const raw = String(text || '').trim().replace(/^\uFEFF/, '');
    const structured = parseJson(raw);
    if (structured !== null) return structured;

    return this.#fallbackExtract(raw);
  }

  #fallbackExtract(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const items = [];
    let current = null;

    for (const line of lines) {
      const match = line.match(/^(?:(?:\d+\.|\-|\*|###)\s*)([^\:]+)(?:\:\s*(.*))?$/);
      if (match) {
        if (current) items.push(current);
        const title = match[1].replace(/[\*\#\`]/g, '').trim();
        const desc = (match[2] || '').trim();
        current = {
          title,
          prompt: desc,
          level: 'junior',
          content: { meaning: desc || title, quick_answer: desc, detailed_answer: desc },
        };
      } else if (current) {
        current.content.detailed_answer = (current.content.detailed_answer ? current.content.detailed_answer + '\n' : '') + line;
      }
    }
    if (current) items.push(current);

    return items.length > 0
      ? items
      : [{ title: 'Generated Content', prompt: text.slice(0, 300), level: 'junior', content: { quick_answer: text, detailed_answer: text } }];
  }
}

module.exports = LearningService;
