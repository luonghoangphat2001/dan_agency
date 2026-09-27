'use strict';

require('module-alias/register');
const { rootDir, initEnv } = require('@database/resolveRoot');
initEnv();

const techLearning = require('@database/seeders/content/seed-tech-learning');
const techFundamentals = require('@database/seeders/content/seed-tech-fundamentals');
const pythonStudentQuiz = require('@database/seeders/content/seed-python-student-quiz');
const englishReadingWriting = require('@database/seeders/content/seed-english-reading-writing');
const ieltsVocabulary = require('@database/seeders/content/seed-ielts-vocabulary-topics-21-50');

async function runAllContentSeeders() {
  console.log('[Content Seeders] Starting full content seeding...');
  
  console.log('\n--- 1. Seeding Tech Learning Questions ---');
  await techLearning.main();

  console.log('\n--- 2. Seeding Tech Fundamentals ---');
  await techFundamentals.main();

  console.log('\n--- 3. Seeding Python Student Quiz ---');
  await pythonStudentQuiz.main();

  console.log('\n[Content Seeders] Completed content seeders successfully.');
}

if (require.main === module) {
  runAllContentSeeders().catch((err) => {
    console.error('[Content Seeders Error]:', err.message);
    process.exit(1);
  });
}

module.exports = {
  techLearning,
  techFundamentals,
  pythonStudentQuiz,
  englishReadingWriting,
  ieltsVocabulary,
  runAllContentSeeders,
};
