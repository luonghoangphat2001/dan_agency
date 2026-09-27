'use strict';
require('module-alias/register');
const { rootDir, initEnv } = require('@database/resolveRoot');
initEnv();
const createRepositories = require('@bootstrap/repositories');

const vocabularyItems = require('@database/maintenance/data/vocabulary-topic-37.json');


async function main() {
  const { vocabRepo } = await createRepositories();
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of vocabularyItems) {
    const result = await vocabRepo.upsertWordByTopicAndWord({
      topicNo: 37,
      word: item.word,
      meaning: item.meaning,
      pronunciation: item.pronunciation,
      example: item.example,
      note: item.note,
      isActive: 1
    });

    if (result.action === 'created') {
      createdCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(JSON.stringify({ ok: true, topicNo: 37, created: createdCount, updated: updatedCount }));
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
