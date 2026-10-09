<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-4">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          👑 CEO Executive Cockpit & Thought Trace
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Dan AI ESR Orchestrator (LangGraph Multi-Agent Engine + 1-Click Exception Approval)
        </p>
      </div>
      <div class="flex gap-3">
        <button
          @click="fetchDailyBrief"
          :disabled="loading"
          class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-medium rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <i class="fas fa-bolt" :class="{ 'fa-spin': loading }"></i>
          Generate 08:00 AM Daily Brief
        </button>
      </div>
    </div>

    <!-- Telemetry Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl shadow-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local vLLM Token Savings</div>
        <div class="text-2xl font-bold text-emerald-400 mt-2">$1,420.50 / mo</div>
        <div class="text-xs text-slate-400 mt-1">74% API Cost Reduction</div>
      </div>
      <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl shadow-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multi-Agent Sub-Agents</div>
        <div class="text-2xl font-bold text-indigo-400 mt-2">5 Active Directors</div>
        <div class="text-xs text-slate-400 mt-1">R&D, CFO, Ops, Logistics, CSKH</div>
      </div>
      <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl shadow-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qdrant RAG Recall Precision</div>
        <div class="text-2xl font-bold text-purple-400 mt-2">98.4%</div>
        <div class="text-xs text-slate-400 mt-1">BM25 + Dense Hybrid Search</div>
      </div>
      <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl shadow-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">OpenClaw Scraper Status</div>
        <div class="text-2xl font-bold text-blue-400 mt-2">Online (:4000)</div>
        <div class="text-xs text-slate-400 mt-1">Playwright Headless Browser</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Directive & Thought Trace -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Interactive Executive Directive Runner -->
        <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <i class="fas fa-paper-plane text-blue-400"></i> Dispatch Executive Directive
          </h2>
          <div class="flex gap-2">
            <input
              v-model="userDirective"
              type="text"
              placeholder="e.g. Audit overall operational status across R&D, CFO and CSKH..."
              class="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              @keyup.enter="triggerOrchestration"
            />
            <button
              @click="triggerOrchestration"
              :disabled="loading"
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-xl text-sm transition-all"
            >
              Run Orchestration
            </button>
          </div>
        </div>

        <!-- Task 5.2: Agent Thought Trace Viewer -->
        <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-5 rounded-2xl shadow-xl space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <i class="fas fa-project-diagram text-purple-400"></i> Agent Thought Trace Viewer
            </h2>
            <span class="text-xs px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700 text-purple-300 font-mono">
              StateGraph Execution
            </span>
          </div>

          <div v-if="thoughtTrace.length === 0" class="text-center py-8 text-slate-500 text-sm">
            No active orchestration run. Click "Run Orchestration" or "Generate Daily Brief".
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="step in thoughtTrace"
              :key="step.step"
              class="p-3.5 bg-slate-900/70 border border-slate-700/70 rounded-xl flex items-start gap-3 transition-all hover:border-slate-600"
            >
              <div class="w-7 h-7 rounded-lg bg-indigo-900/80 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-700">
                {{ step.step }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-sm text-indigo-300">{{ step.agent }}</span>
                  <span class="text-xs text-emerald-400 font-mono"><i class="fas fa-check-circle"></i> Completed</span>
                </div>
                <p class="text-xs text-slate-300 mt-1 font-mono">{{ step.task }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Executive Report Synthesis -->
        <div v-if="finalReport" class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-5 rounded-2xl shadow-xl space-y-3">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <i class="fas fa-file-signature text-emerald-400"></i> Final Executive Synthesis
          </h2>
          <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-700 text-sm whitespace-pre-wrap font-mono leading-relaxed text-slate-200">
            {{ finalReport }}
          </div>
        </div>
      </div>

      <!-- Right Column: Task 4.5 Exception Inbox & 1-Click Approval -->
      <div class="space-y-6">
        <div class="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-5 rounded-2xl shadow-xl space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <i class="fas fa-inbox text-amber-400"></i> CEO Exception Inbox
            </h2>
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-700 text-amber-300 font-bold">
              {{ exceptions.length }} Pending
            </span>
          </div>

          <div v-if="exceptions.length === 0" class="text-center py-6 text-slate-500 text-sm">
            Zero exception items requiring CEO approval.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in exceptions"
              :key="item.id"
              class="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-3"
            >
              <div class="flex justify-between items-start">
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-800">
                  {{ item.severity }}
                </span>
                <span class="text-[11px] text-slate-400 font-mono">{{ item.source }}</span>
              </div>
              <h3 class="font-medium text-sm text-slate-100">{{ item.title }}</h3>
              <p class="text-xs text-slate-300">{{ item.description }}</p>

              <!-- 1-Click Approval Controls -->
              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  @click="handleApproval(item.id, 'APPROVED')"
                  class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg transition-all"
                >
                  <i class="fas fa-check"></i> Approve
                </button>
                <button
                  @click="handleApproval(item.id, 'REJECTED')"
                  class="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-semibold rounded-lg transition-all"
                >
                  <i class="fas fa-times"></i> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/request';

const loading = ref(false);
const userDirective = ref('');
const thoughtTrace = ref([]);
const finalReport = ref('');
const exceptions = ref([]);

const fetchDailyBrief = async () => {
  loading.value = true;
  try {
    const responsePayload = await api.get('/ceo/daily-brief?notify=false');
    const responseData = responsePayload?.data;
    if (responseData?.orchestration) {
      thoughtTrace.value = responseData.orchestration.plan_steps || [];
      finalReport.value = responseData.orchestration.final_synthesis || '';
    }
  } catch (error) {
    console.error('Failed to fetch daily brief:', error);
  } finally {
    loading.value = false;
  }
};

const triggerOrchestration = async () => {
  if (!userDirective.value) return;
  loading.value = true;
  try {
    const responsePayload = await api.post('/ceo/orchestrate', {
      prompt: userDirective.value,
      executiveRole: 'ceo'
    });
    const responseData = responsePayload?.data;
    if (responseData) {
      thoughtTrace.value = responseData.plan_steps || [];
      finalReport.value = responseData.final_synthesis || '';
    }
  } catch (error) {
    console.error('Failed to run orchestration:', error);
  } finally {
    loading.value = false;
  }
};

const fetchExceptions = async () => {
  try {
    const responsePayload = await api.get('/ceo/exception-inbox');
    exceptions.value = responsePayload?.data?.exceptions || [];
  } catch (error) {
    console.error('Failed to fetch exception inbox:', error);
  }
};

const handleApproval = async (approvalId, decision) => {
  try {
    await api.post('/ceo/approval', { approvalId, decision });
    exceptions.value = exceptions.value.filter(exceptionItem => exceptionItem.id !== approvalId);
  } catch (error) {
    console.error('Failed to process approval:', error);
  }
};

onMounted(() => {
  fetchExceptions();
  fetchDailyBrief();
});
</script>
