'use strict';

/**
 * Shared boundary for AI/imported learning content.
 * Keeps JSON repair and legacy wrapper handling out of controllers and DB code.
 */
function parseJson(rawValue) {
  if (rawValue && typeof rawValue === 'object') return rawValue;
  if (typeof rawValue !== 'string' || !rawValue.trim()) return null;

  const sanitizedText = rawValue.trim().replace(/^\uFEFF/, '');
  const markdownFenceMatch = sanitizedText.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  const candidateJson = markdownFenceMatch ? markdownFenceMatch[1].trim() : sanitizedText;

  try {
    return JSON.parse(candidateJson);
  } catch (_) {}

  const balancedJson = extractBalancedJson(candidateJson);
  if (balancedJson !== null) {
    try {
      return JSON.parse(balancedJson);
    } catch (_) {}
  }

  const recoveredObjects = extractObjects(candidateJson);
  if (recoveredObjects.length > 0) {
    const isSingleNonArray = recoveredObjects.length === 1 && !candidateJson.startsWith('[');
    return isSingleNonArray ? recoveredObjects[0] : recoveredObjects;
  }

  return null;
}

/**
 * Extracts the first balanced JSON block ([...] or {...}) using a single-pass depth counter.
 */
function extractBalancedJson(rawText) {
  const delimiterMatch = rawText.match(/[{\[]/);
  if (!delimiterMatch) return null;

  const startIndex = delimiterMatch.index;
  const openingDelimiter = rawText[startIndex];
  const closingDelimiter = openingDelimiter === '[' ? ']' : '}';

  let nestingDepth = 0;
  let isInsideString = false;
  let isEscapedChar = false;

  for (let charIndex = startIndex; charIndex < rawText.length; charIndex++) {
    const currentChar = rawText[charIndex];

    if (isInsideString) {
      if (isEscapedChar) {
        isEscapedChar = false;
      } else if (currentChar === '\\') {
        isEscapedChar = true;
      } else if (currentChar === '"') {
        isInsideString = false;
      }
      continue;
    }

    if (currentChar === '"') {
      isInsideString = true;
    } else if (currentChar === openingDelimiter) {
      nestingDepth++;
    } else if (currentChar === closingDelimiter) {
      nestingDepth--;
      if (nestingDepth === 0) {
        return rawText.slice(startIndex, charIndex + 1);
      }
    }
  }

  return null;
}

/**
 * Recovers all complete top-level JSON objects from text.
 */
function extractObjects(rawText) {
  const parsedObjects = [];
  let objectStartIndex = -1;
  let nestingDepth = 0;
  let isInsideString = false;
  let isEscapedChar = false;

  for (let charIndex = 0; charIndex < rawText.length; charIndex++) {
    const currentChar = rawText[charIndex];

    if (isInsideString) {
      if (isEscapedChar) {
        isEscapedChar = false;
      } else if (currentChar === '\\') {
        isEscapedChar = true;
      } else if (currentChar === '"') {
        isInsideString = false;
      }
      continue;
    }

    if (currentChar === '"') {
      isInsideString = true;
    } else if (currentChar === '{') {
      if (nestingDepth === 0) {
        objectStartIndex = charIndex;
      }
      nestingDepth++;
    } else if (currentChar === '}' && nestingDepth > 0) {
      nestingDepth--;
      if (nestingDepth === 0 && objectStartIndex >= 0) {
        try {
          parsedObjects.push(JSON.parse(rawText.slice(objectStartIndex, charIndex + 1)));
        } catch (_) {}
        objectStartIndex = -1;
      }
    }
  }

  return parsedObjects;
}

function isLearningItem(target) {
  return target && typeof target === 'object' && (
    typeof target.title === 'string' || typeof target.word === 'string'
  );
}

/**
 * Unpacks nested arrays or legacy wrappers into flat learning items.
 */
function unpackItems(rawItems) {
  const normalizedItems = [];
  const pendingItems = Array.isArray(rawItems) ? [...rawItems] : [rawItems];

  while (pendingItems.length > 0) {
    const currentItem = pendingItems.shift();
    const parsedItem = typeof currentItem === 'string' ? parseJson(currentItem) : currentItem;
    if (!parsedItem) continue;

    if (Array.isArray(parsedItem)) {
      pendingItems.unshift(...parsedItem);
      continue;
    }

    if (!isLearningItem(parsedItem) || parsedItem.title === 'Generated Content') {
      const nestedContent = parseJson(parsedItem.prompt) || parseJson(parsedItem.content);
      if (Array.isArray(nestedContent)) {
        pendingItems.unshift(...nestedContent);
        continue;
      }
    }

    if (isLearningItem(parsedItem)) {
      normalizedItems.push(normalizeItem(parsedItem));
    }
  }

  return normalizedItems;
}

/**
 * Normalizes learning item attributes and cleans AI title prefixes.
 */
function normalizeItem(rawItem, fallbackDefaults = {}) {
  const contentPayload = parseJson(rawItem.content) || {};
  const sampleSolution = parseJson(rawItem.sample_solution ?? rawItem.sampleSolution) || {};
  const rawTitle = String(rawItem.title || rawItem.word || contentPayload.word || 'Untitled').trim();

  const cleanedTitle = rawTitle
    .replace(/^(?:câu hỏi|cau hoi|question)\s*\d+\s*[:.)\-–—]\s*/i, '')
    .trim() || rawTitle;

  return {
    ...rawItem,
    title: cleanedTitle,
    prompt: String(rawItem.prompt || contentPayload.example || '').trim(),
    level: rawItem.level || fallbackDefaults.level || 'junior',
    content: contentPayload,
    sample_solution: sampleSolution,
    tags: rawItem.tags || fallbackDefaults.tags || '',
  };
}

module.exports = { parseJson, unpackItems, normalizeItem };
