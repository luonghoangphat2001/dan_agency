'use strict';

/**
 * Schema definitions for Learning Hub AI prompts and evaluation templates.
 */
const LEARNING_CONFIG_SCHEMA = [
  {
    key: 'learning_prompt_tech',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_vocab',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_quiz',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_reading',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_writing',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_speaking',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_ielts',
    type: 'text',
    category: 'learning_prompt',
  },
  {
    key: 'learning_prompt_eval_tech',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_reading',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_writing',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_speaking',
    type: 'text',
    category: 'learning_evaluation',
  },
  {
    key: 'learning_prompt_eval_ielts',
    type: 'text',
    category: 'learning_evaluation',
  },
];

/**
 * UI schema and metadata for Learning Hub custom AI prompts.
 */
const PROMPT_FIELDS_METADATA = [
  { key: 'learning_prompt_tech', iconClass: 'fa-solid fa-laptop-code', labelKey: 'manager.config.prompts.learning_prompt_tech.label', placeholderKey: 'manager.config.prompts.learning_prompt_tech.placeholder' },
  { key: 'learning_prompt_vocab', iconClass: 'fa-solid fa-book-open', labelKey: 'manager.config.prompts.learning_prompt_vocab.label', placeholderKey: 'manager.config.prompts.learning_prompt_vocab.placeholder' },
  { key: 'learning_prompt_quiz', iconClass: 'fa-solid fa-puzzle-piece', labelKey: 'manager.config.prompts.learning_prompt_quiz.label', placeholderKey: 'manager.config.prompts.learning_prompt_quiz.placeholder' },
  { key: 'learning_prompt_reading', iconClass: 'fa-solid fa-book-open-reader', labelKey: 'manager.config.prompts.learning_prompt_reading.label', placeholderKey: 'manager.config.prompts.learning_prompt_reading.placeholder' },
  { key: 'learning_prompt_writing', iconClass: 'fa-solid fa-pen-fancy', labelKey: 'manager.config.prompts.learning_prompt_writing.label', placeholderKey: 'manager.config.prompts.learning_prompt_writing.placeholder' },
  { key: 'learning_prompt_speaking', iconClass: 'fa-solid fa-microphone-lines', labelKey: 'manager.config.prompts.learning_prompt_speaking.label', placeholderKey: 'manager.config.prompts.learning_prompt_speaking.placeholder' },
  { key: 'learning_prompt_ielts', iconClass: 'fa-solid fa-graduation-cap', labelKey: 'manager.config.prompts.learning_prompt_ielts.label', placeholderKey: 'manager.config.prompts.learning_prompt_ielts.placeholder' },
  { key: 'learning_prompt_eval_tech', iconClass: 'fa-solid fa-robot', labelKey: 'manager.config.prompts.learning_prompt_eval_tech.label', placeholderKey: 'manager.config.prompts.learning_prompt_eval_tech.placeholder' },
  { key: 'learning_prompt_eval_reading', iconClass: 'fa-solid fa-robot', labelKey: 'manager.config.prompts.learning_prompt_eval_reading.label', placeholderKey: 'manager.config.prompts.learning_prompt_eval_reading.placeholder' },
  { key: 'learning_prompt_eval_writing', iconClass: 'fa-solid fa-robot', labelKey: 'manager.config.prompts.learning_prompt_eval_writing.label', placeholderKey: 'manager.config.prompts.learning_prompt_eval_writing.placeholder' },
  { key: 'learning_prompt_eval_speaking', iconClass: 'fa-solid fa-robot', labelKey: 'manager.config.prompts.learning_prompt_eval_speaking.label', placeholderKey: 'manager.config.prompts.learning_prompt_eval_speaking.placeholder' },
  { key: 'learning_prompt_eval_ielts', iconClass: 'fa-solid fa-robot', labelKey: 'manager.config.prompts.learning_prompt_eval_ielts.label', placeholderKey: 'manager.config.prompts.learning_prompt_eval_ielts.placeholder' },
];

module.exports = {
  LEARNING_CONFIG_SCHEMA,
  PROMPT_FIELDS_METADATA,
};
