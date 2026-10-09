'use strict';

const axios = require('axios');

/**
 * Client communicating with dan-ai-engine (Python FastAPI Microservice - Port 8000).
 * Handles Hybrid RAG ingestion, Vector Querying, and LangGraph Multi-Agent Orchestration.
 */
class AIEngineClient {
  #client;

  /**
   * @param {string} [baseUrl]
   */
  constructor(baseUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000') {
    this.#client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Check if Python AI Engine microservice is responsive.
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await this.#client.get('/health');
      return response.status === 200 && response.data?.status === 'ok';
    } catch (_) {
      return false;
    }
  }

  /**
   * Ingest text/document vector into Qdrant Vector DB via dan-ai-engine.
   * @param {{ documentId: string, content: string, metadata?: object }} payload
   */
  async ingestDocument(payload) {
    const { data } = await this.#client.post('/api/v1/rag/ingest', payload);
    return data;
  }

  /**
   * Query Hybrid RAG (Dense + Sparse BM25 + Re-ranker).
   * @param {{ query: string, topK?: number, category?: string }} payload
   */
  async queryHybridRAG(payload) {
    const { data } = await this.#client.post('/api/v1/rag/query', payload);
    return data;
  }

  /**
   * Trigger LangGraph Multi-Agent Orchestrator.
   * @param {{ prompt: string, userId: string, executiveRole?: string }} payload
   */
  async orchestrateAgent(payload) {
    const { data } = await this.#client.post('/api/v1/agent/orchestrate', payload);
    return data;
  }
}

const defaultClient = new AIEngineClient();
module.exports = defaultClient;
module.exports.AIEngineClient = AIEngineClient;

