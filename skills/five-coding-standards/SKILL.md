---
name: five-coding-standards
description: Permanent 5 Mandatory Coding Standards for Dan AI Ecosystem Architecture and Quality Assurance
---

# Dan AI Ecosystem — 5 Mandatory Coding Standards

This skill documents the five non-negotiable coding standards enforced across the Dan AI repository:

1. **No Inappropriate Relative Paths**:
   - Always use module aliases (`@enums`, `@skills`, `@services`, `@controllers`, `@config`, `@utils`, `@models`, `@middleware`, `@routes`, `@lang`) registered in `package.json` (`_moduleAliases` & `jest.moduleNameMapper`).
   - Relative path traversals such as `../` or `../../` are strictly prohibited.

2. **Independent Enum Files**:
   - Every fixed-value enum must be defined in its own isolated `.enum.js` file inside `src/enums/` (e.g., `src/enums/ai-provider.enum.js`, `src/enums/learning-type.enum.js`, `src/enums/task-status.enum.js`, `src/enums/user-role.enum.js`).
   - Do not bundle multiple enums into single monolithic files.

3. **Externalized JSON Rules & AI Skills**:
   - Business directives, decision fallbacks, and skill rules must be stored in JSON files under `skills/`.
   - Do not hardcode Vietnamese/English text strings or fallbacks (`|| 'default'`) inside JavaScript source files.

4. **English Technical Source Code & Documentation**:
   - All source code, variable/class names, JSDoc docstrings, internal comments, and developer guides must be written strictly in English.

5. **Permanent Standard Enforcement**:
   - Every new feature, service, or refactoring in Dan AI Ecosystem must adhere to these five standards.
