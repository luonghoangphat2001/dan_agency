import { createRouter, createWebHistory } from 'vue-router';
import { routes } from '@router/routes';
import { setupGuards } from '@router/guards';

export * from '@router/constants';
export * from '@router/routes';
export * from '@router/guards';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

setupGuards(router);

export default router;
