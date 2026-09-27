import { defineStore } from 'pinia';
import { sendChatMessage } from '@/api/chat';
import { translate } from '@/lang';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    activeModel: localStorage.getItem('dan_active_model') || 'gemini',
    loading: false,
  }),
  actions: {
    setModel(selectedModel) {
      this.activeModel = selectedModel;
      localStorage.setItem('dan_active_model', selectedModel);
    },
    async sendMessage(messageText) {
      if (!messageText.trim() || this.loading) return;

      this.messages.push({
        id: Date.now(),
        role: 'user',
        content: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      this.loading = true;
      try {
        const chatResponse = await sendChatMessage(messageText, this.activeModel);
        this.messages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: chatResponse.response || chatResponse.message || translate('common.status.no_data'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (chatError) {
        this.messages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: `❌ ${translate('common.status.error')}: ${chatError.message}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } finally {
        this.loading = false;
      }
    },
    clearChat() {
      this.messages = [];
    },
  },
});
