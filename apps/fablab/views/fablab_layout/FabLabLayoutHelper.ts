import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbConfig {
  showBreadcrumbs: boolean;
  items: BreadcrumbItem[];
}

export const useBreadcrumbs = (): BreadcrumbConfig => {
  const location = useLocation();
  const { t } = useLanguage();

  return useMemo(() => {
    const pathname = location.pathname;
    const search = location.search;

    const params = new URLSearchParams(search);
    const id = params.get('id');

    const base: BreadcrumbItem[] = [
      { name: t?.sidebar?.dashboard ?? 'Dashboard', href: '/dashboard' },
    ];

    // /dashboard/applications
    if (pathname === '/dashboard/applications') {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.applicationsManagement?.title ?? 'Applications', href: '/dashboard/applications' },
        ],
      };
    }

    // /dashboard/applications/new
    if (pathname === '/dashboard/applications/new') {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.applicationsManagement?.title ?? 'Applications', href: '/dashboard/applications' },
          { name: (t as any)?.common?.create ?? 'Create', href: '/dashboard/applications/new' },
        ],
      };
    }

    // /dashboard/applications/deployer?id={id}
    if (pathname === '/dashboard/applications/deployer' && id) {
      return {
        showBreadcrumbs: true,
        items: [
          ...base,
          { name: (t as any)?.deployProjectTranslations?.title ?? 'Deployer', href: '/dashboard/applications' },
          { name: `#${id}`, href: `/dashboard/applications/deployer?id=${id}` },
        ],
      };
    }

    return { showBreadcrumbs: false, items: [] };
  }, [location.pathname, location.search, t]);
};
