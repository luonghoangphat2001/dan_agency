import { useAuthStore } from '@/stores/auth';
import { translate } from '@/lang';
import { ROUTE_NAMES, DEFAULT_TECH_STACK } from '@router/constants';

/**
 * Setup authentication guard adhering to Vue Router 4 standards (return location, no next() callback).
 * @param {import('vue-router').Router} routerInstance
 */
export function setupAuthGuard(routerInstance) {
  routerInstance.beforeEach(async (targetRoute) => {
    const authStore = useAuthStore();
    if (!authStore.initialized) {
      await authStore.fetchUser();
    }

    if (targetRoute.meta.requiresAuth && !authStore.isAuthenticated) {
      const redirectQuery = targetRoute.fullPath && targetRoute.fullPath !== '/' && targetRoute.fullPath !== '/login'
        ? { redirect: targetRoute.fullPath }
        : undefined;
      return { name: ROUTE_NAMES.LOGIN, query: redirectQuery };
    }

    if (targetRoute.meta.guestOnly && authStore.isAuthenticated) {
      return { name: ROUTE_NAMES.TECH, params: { stack: DEFAULT_TECH_STACK } };
    }
  });
}

/**
 * Setup document title guard to dynamically sync browser tab title with route meta.
 * @param {import('vue-router').Router} routerInstance
 */
export function setupTitleGuard(routerInstance) {
  routerInstance.afterEach((targetRoute) => {
    const routeTitleKey = targetRoute.meta?.titleKey;
    const resolvedPageTitle = routeTitleKey ? translate(routeTitleKey) : targetRoute.meta?.title;
    document.title = resolvedPageTitle ? `${resolvedPageTitle} - Dan Studio` : 'Dan Studio';
  });
}

/**
 * Setup all navigation guards on the router instance.
 * @param {import('vue-router').Router} routerInstance
 */
export function setupGuards(routerInstance) {
  setupAuthGuard(routerInstance);
  setupTitleGuard(routerInstance);
}
