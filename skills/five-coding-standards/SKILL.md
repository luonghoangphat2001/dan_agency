---
name: five-coding-standards
description: Permanent 5 Mandatory Coding Standards for OpenClaw Repository Architecture and Quality Assurance
---

# OpenClaw — 5 Mandatory Coding Standards

This skill documents the five non-negotiable coding standards enforced across the OpenClaw repository:

1. **No Inappropriate Relative Paths**:
   - Always use module aliases (`@enums`, `@skills`, `@services`, `@controllers`, `@config`, `@utils`, `@repositories`, `@middleware`, `@routes`, `@schemas`, `@policy`, `@database`) registered in `package.json` (`_moduleAliases` & `jest.moduleNameMapper`).
   - Relative path traversals such as `../` or `../../` are strictly prohibited.

2. **Independent Enum Files**:
   - Every fixed-value enum must be defined in its own isolated `.enum.js` file inside `src/enums/` (e.g., `src/enums/domain-agent.enum.js`, `src/enums/plan-status.enum.js`).
   - Do not bundle multiple enums into single monolithic files.

3. **Externalized JSON Rules & AI Skills**:
   - Business directives, decision fallbacks, OKR mappings, and arbitration rules must be stored in JSON files under `skills/` (e.g., `skills/ceo-planner/rules.json`, `skills/ceo-arbitration/rules.json`).
   - Do not hardcode Vietnamese/English text strings or fallbacks (`|| 'default'`) inside JavaScript source files.

4. **English Technical Source Code & Documentation**:
   - All source code, variable/class names, JSDoc docstrings, internal comments, and developer guides must be written strictly in English.

5. **Permanent Standard Enforcement**:
   - Every new feature, service, or refactoring in OpenClaw must adhere to these five standards.
