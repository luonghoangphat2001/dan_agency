'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for executing safe read-only SQL queries against internal MySQL database.
 * Protected with strict guardrails: only SELECT queries, no DDL/DML, row limits.
 */
class MySQLQueryTool extends BaseTool {
  /** @type {import('@models/Database')} */
  #database;

  constructor(database) {
    const schema = z.object({
      sql: z.string().min(6).describe(localization.t('agent.tools.mysql_query.schema_sql')),
      reason: z.string().describe(localization.t('agent.tools.mysql_query.schema_reason'))
    });

    super(
      'mysql_query',
      localization.t('agent.tools.mysql_query.description'),
      schema
    );

    this.#database = database;
  }

  /**
   * Validates if SQL statement is strictly read-only.
   * @param {string} sqlStatement
   */
  #assertReadOnly(sqlStatement) {
    const trimmedStatement = sqlStatement.trim();
    // Must start with SELECT, SHOW, DESCRIBE, or EXPLAIN
    if (!/^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\s+/i.test(trimmedStatement)) {
      throw new Error(localization.t('agent.tools.mysql_query.error_read_only_only'));
    }

    // Dangerous keywords check
    const dangerousKeywords = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|FLUSH)\b/i;
    if (dangerousKeywords.test(trimmedStatement)) {
      throw new Error(localization.t('agent.tools.mysql_query.error_dangerous_keywords'));
    }

    // Check semicolon injection (multiple queries)
    const statements = trimmedStatement.split(';').map(statement => statement.trim()).filter(Boolean);
    if (statements.length > 1) {
      throw new Error(localization.t('agent.tools.mysql_query.error_multiple_statements'));
    }
  }

  async execute(parameters, context = {}) {
    this.#assertReadOnly(parameters.sql);

    let executableSql = parameters.sql.trim();
    // Enforce row limit if not present
    if (/^SELECT\s+/i.test(executableSql) && !/\bLIMIT\s+\d+/i.test(executableSql)) {
      executableSql = `${executableSql} LIMIT 50`;
    }

    try {
      const rows = await this.#database.query(executableSql);
      return {
        success: true,
        count: Array.isArray(rows) ? rows.length : 1,
        data: rows
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = MySQLQueryTool;
