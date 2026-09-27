'use strict';

const config = require('@config');
const AIService = require('@services/ai/AIService');
const OpenClawService = require('@services/openclaw/OpenClawService');
const LearningService = require('@services/learning/LearningService');
const VocabularyService = require('@services/learning/VocabularyService');
const QuizEngine = require('@services/learning/QuizEngine');
const TechService = require('@services/learning/TechService');
const DiscordNotificationService = require('@services/notification/DiscordNotificationService');
const AgentService = require('@services/agent/AgentService');

async function createServices(repositories) {
  const {
    db,
    userRepo,
    configRepo,
    conversationRepo,
    learningRepo,
    vocabRepo,
    quizRepo,
    techRepo,
    discordNotificationRepo,
    insightRepo,
    agentStateRepo,
  } = repositories;

  if (userRepo) {
    await userRepo.ensureDefaultAdmin();
  }

  const aiService = new AIService(configRepo, conversationRepo, insightRepo);
  const openClaw = new OpenClawService(
    config.openclaw.apiUrl,
    config.openclaw.apiSecret,
    config.openclaw.timeoutMs,
  );

  const techService = new TechService(techRepo, aiService, configRepo);
  await techService.seedInitialBankIfEmpty();

  const discordNotificationService = new DiscordNotificationService(discordNotificationRepo, configRepo);

  const agentService = new AgentService({
    aiService,
    database: db,
    stateRepository: agentStateRepo,
    conversationRepository: conversationRepo,
    insightRepository: insightRepo,
    openClawService: openClaw,
    discordNotifyService: discordNotificationService,
  });

  return {
    aiService,
    openClaw,
    learningService: new LearningService(learningRepo, aiService, configRepo),
    vocabService: new VocabularyService(vocabRepo, configRepo),
    quizEngine: new QuizEngine(vocabRepo, quizRepo),
    techService,
    discordNotificationService,
    agentService,
  };
}

module.exports = createServices;
