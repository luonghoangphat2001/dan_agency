---
name: reusable-architecture
description: "Guidelines and architectural standards for identifying, designing, and using reusable shared components across the codebase while avoiding duplicated logic and over-abstraction."
---

# Reusable Architecture & Shared Feature Standards

## 1. Core Architectural Principle

The codebase strictly follows the **Define Once → Standardize → Reuse Everywhere** pattern.

```text
                    ┌── Learning Service / Tech Service
                    │
Shared Component ───┼── History Controller / Tech Controller
(Import / Export /  │
 Pagination / DB)   ├── TaskRepository / InsightRepository / QuizRepository
                    │   ├── AgentStateRepository / OpenClawRepository
                    └── Future Features
```

### Key Rules:
1. **Single Entry Point**: Common capabilities must have a single, standard service/contract.
2. **Feature Consumption**: Features MUST consume shared components rather than reimplementing low-level logic.
3. **Dependency Direction**: Shared components must NEVER depend on feature-specific implementations.
4. **No Direct Third-Party SDK Leakage**: Features must interact with shared services (e.g., `ImportService`, `ExportService`, `AIFactory`) rather than importing third-party libraries (e.g., `xlsx`, `axios`, SDKs) directly.
5. **Zero Relative Imports**: NEVER use relative path imports (`./`, `../`). ALWAYS use registered Module Alias Namespaces (`@models`, `@enums`, `@services`, `@controllers`, `@utils`, `@config`, `@lang`).
6. **Mandatory Enum Extraction**: Extract constant mappings, env keys, statuses, and types into standalone frozen Enum files in `@enums/`.
7. **Zero Hardcoded Text in Logic**: Store all user-facing messages, error strings, and system prompts in JSON files or localization schemas (`@lang`).

---

## 2. Shared Capability Map & Guidelines

### A. File Import (`ImportService`)
- **Location**: `src/services/import/`
- **Contract**: `ImportService` delegating to `ExcelReader`, `CsvReader`.
- **Usage**:
  ```javascript
  const ImportService = require('@services/import/ImportService');
  const importService = new ImportService();
  const rows = importService.importExcel(buffer, { headerAsArray: true });
  ```

### B. File Export (`ExportService`)
- **Location**: `src/services/export/`
- **Contract**: `ExportService` delegating to `ExcelExporter`, `CsvExporter`.
- **Usage**:
  ```javascript
  const ExportService = require('@services/export/ExportService');
  const exportService = new ExportService();
  const buffer = exportService.exportExcel(data, { sheetName: 'Report' });
  ```

### C. Request Pagination (`PaginationUtils`)
- **Location**: `src/utils/PaginationUtils.js`
- **Contract**: Unified parsing of request query parameters (`limit`, `offset`, `page`) and standard paginated response payload builder.
- **Usage**:
  ```javascript
  const PaginationUtils = require('@utils/PaginationUtils');
  
  // Parse request query safely
  const { limit, offset, page } = PaginationUtils.parse(req.query, { defaultLimit: 50, maxLimit: 200 });

  // Format paginated output
  const payload = PaginationUtils.format(items, total, page, limit);
  ```

### D. Base Repository Architecture (`BaseRepository`)
- **Location**: `src/models/BaseRepository.js`
- **Contract**: Abstract base repository providing common CRUD operations (`findById`, `deleteById`, `count`, `paginateQuery`) and database encapsulation.
- **Usage**:
  ```javascript
  const BaseRepository = require('./BaseRepository');

  class TaskRepository extends BaseRepository {
    constructor(db) {
      super(db, 'agent_tasks');
    }
  }
  ```

### E. AI Providers & Factory (`AIFactory` / `AIService`)
- **Location**: `src/services/ai/`
- **Contract**: `AIFactory.create(providerName, config)` returning `AIProvider` instances.
- **Usage**:
  ```javascript
  const AIFactory = require('@services/ai/AIFactory');
  const provider = AIFactory.create('claude');
  const response = await provider.chat(messages, systemPrompt);
  ```

### F. API Response Standardization (`ApiResponse`)
- **Location**: `src/utils/ApiResponse.js`
- **Contract**: Unified Express JSON response formatting with pagination helpers.
- **Usage**:
  ```javascript
  const ApiResponse = require('@utils/ApiResponse');
  
  // Success
  return ApiResponse.success(res, data, 200, 'Success');
  // Paginated
  return ApiResponse.paginate(res, items, total, page, limit);
  // Error
  return ApiResponse.error(res, 'Invalid request', 400, 'VALIDATION_ERROR');
  ```

### G. Logging (`Logger`)
- **Location**: `src/utils/Logger.js`
- **Contract**: Standard application logging with automatic file rotation and cleanup.
- **Usage**: Use `Logger.init()` at boot. All standard `console.log`, `console.info`, `console.warn`, and `console.error` calls are formatted with ISO timestamps and captured to daily log files.

---

## 3. When NOT to Abstract (Preventing Over-Abstraction)

Do NOT create a shared abstraction if:
1. The capability is unique to a single feature and unlikely to be reused.
2. The logic consists only of domain-specific business rules.
3. Abstracting it creates a generic "dumping ground" class (`UtilsEverything`, `GodService`, `CommonHelper`).

---

## 4. Checklist for Future AI Agents & Developers

Before implementing any feature, answer:
- [ ] Does this capability already exist in `src/services/` or `src/utils/`?
- [ ] Am I importing a low-level 3rd party library (like `xlsx`) directly inside a controller or feature service? If yes, route through the shared capability service.
- [ ] Is my new shared component free from feature-specific imports?
- [ ] Does my repository inherit from `BaseRepository`?
- [ ] Did I run unit tests (`npm test`) after refactoring?
