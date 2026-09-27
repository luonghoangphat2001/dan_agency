<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <i class="fa-solid fa-calendar-days text-indigo-600 dark:text-indigo-400"></i>
            <span>{{ $translate('manager.schedule.title') }}</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $translate('manager.schedule.subtitle') }}</p>
        </div>
        <button @click="load" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
          <i class="fa-solid fa-rotate text-xs"></i>
          <span>{{ $translate('common.actions.refresh') }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form @submit.prevent="save" class="panel-card space-y-4">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ editingId ? `${$translate('common.actions.edit')} #${editingId}` : $translate('manager.schedule.add_job') }}</h2>
          <label class="block"><span class="field-label">User ID</span><input v-model.trim="form.user_id" required class="field" /></label>
          <label class="block"><span class="field-label">{{ $translate('manager.users.username') }}</span><input v-model.trim="form.username" class="field" /></label>
          <div class="grid grid-cols-2 gap-3">
            <label><span class="field-label">Platform</span><select v-model="form.platform" class="field"><option>discord</option><option>telegram</option></select></label>
            <label><span class="field-label">{{ $translate('manager.schedule.cron_expression') }}</span><select v-model="form.repeat_type" class="field"><option value="none">none</option><option value="daily">daily</option><option value="weekly">weekly</option></select></label>
          </div>
          <label class="block"><span class="field-label">Channel ID</span><input v-model.trim="form.channel_id" class="field" /></label>
          <label class="block"><span class="field-label">{{ $translate('manager.schedule.job_name') }}</span><input v-model.trim="form.title" required class="field" /></label>
          <label class="block"><span class="field-label">{{ $translate('manager.schedule.next_run') }}</span><input v-model="form.remind_at" type="datetime-local" required class="field" /></label>
          <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input v-model="form.is_active" type="checkbox" class="accent-indigo-600" /> {{ $translate('common.status.active') }}</label>
          <div class="flex gap-3 pt-2">
            <button :disabled="saving" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 rounded-xl text-xs font-semibold transition">{{ editingId ? $translate('common.actions.update') : $translate('common.actions.create') }}</button>
            <button type="button" @click="clear" class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition">{{ $translate('common.actions.cancel') }}</button>
          </div>
          <p v-if="message" :class="ok ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-xs font-semibold">{{ message }}</p>
        </form>

        <section class="lg:col-span-2 panel-card !p-0 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
            <h2 class="font-bold text-gray-900 dark:text-white text-sm">{{ $translate('manager.schedule.title') }}</h2>
            <label class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2"><input v-model="includeInactive" @change="load" type="checkbox" class="accent-indigo-600" /> {{ $translate('common.actions.all') }}</label>
          </div>
          <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">{{ $translate('common.actions.loading') }}</div>
          <div v-else-if="!schedules.length" class="p-6 text-sm text-gray-500 dark:text-gray-400">{{ $translate('common.status.no_data') }}</div>
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <article v-for="row in schedules" :key="row.id" class="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
              <div class="w-12 text-xs font-mono text-gray-400">#{{ row.id }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ row.title }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ row.remind_at }} · {{ row.repeat_type }} · {{ row.platform }} · <span :class="Number(row.is_active) === 1 ? 'text-emerald-600 dark:text-green-400 font-semibold' : 'text-gray-400'">{{ Number(row.is_active) === 1 ? $translate('common.status.active') : $translate('common.status.inactive') }}</span></div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">user: {{ row.username || row.user_id }} · channel: {{ row.channel_id || 'default' }}</div>
              </div>
              <button @click="edit(row)" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{{ $translate('common.actions.edit') }}</button>
              <button @click="remove(row.id)" class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">{{ $translate('common.actions.delete') }}</button>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from '@/api/schedule';
import { translate } from '@/lang';

const emptyForm = () => ({ user_id: '', username: '', platform: 'discord', channel_id: '', title: '', remind_at: '', repeat_type: 'none', is_active: true });
const schedules = ref([]);
const form = reactive(emptyForm());
const editingId = ref(null);
const includeInactive = ref(false);
const loading = ref(false);
const saving = ref(false);
const message = ref('');
const ok = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const responsePayload = await getSchedules(includeInactive.value);
    schedules.value = responsePayload?.schedules || [];
  } catch (scheduleError) {
    message.value = scheduleError.message;
    ok.value = false;
  } finally {
    loading.value = false;
  }
};

const payload = () => ({ ...form, remind_at: `${form.remind_at.replace('T', ' ')}:00`, is_active: form.is_active ? 1 : 0 });

const save = async () => {
  saving.value = true;
  try {
    const saveResult = editingId.value ? await updateSchedule(editingId.value, payload()) : await createSchedule(payload());
    if (!saveResult?.ok) throw new Error(saveResult?.error || translate('manager.config.save_error'));
    message.value = `✓ ${translate('common.status.success')}`;
    ok.value = true;
    clear();
    await load();
  } catch (saveError) {
    message.value = saveError.message;
    ok.value = false;
  } finally {
    saving.value = false;
  }
};

const edit = (scheduleRow) => {
  editingId.value = scheduleRow.id;
  Object.assign(form, {
    user_id: scheduleRow.user_id || '',
    username: scheduleRow.username || '',
    platform: scheduleRow.platform || 'discord',
    channel_id: scheduleRow.channel_id || '',
    title: scheduleRow.title || '',
    remind_at: String(scheduleRow.remind_at || '').replace(' ', 'T').slice(0, 16),
    repeat_type: scheduleRow.repeat_type || 'none',
    is_active: Number(scheduleRow.is_active) === 1
  });
};

const clear = () => {
  editingId.value = null;
  Object.assign(form, emptyForm());
};

const remove = async (scheduleId) => {
  if (confirm(translate('manager.schedule.delete_confirm'))) {
    await deleteSchedule(scheduleId);
    await load();
  }
};

onMounted(load);
</script>
