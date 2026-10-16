'use strict';

/**
 * User progress status for learning items and tech questions.
 */
const LearningProgressStatus = Object.freeze({
  UNSTUDIED: 'unstudied',
  STUDYING: 'studying',
  LEARNING: 'learning',
  MASTERED: 'mastered',
  REVIEW_NEEDED: 'review_needed',
});

module.exports = LearningProgressStatus;
