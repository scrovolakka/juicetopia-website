export type NavItem = {
  id: string;
  label: string;
  href: string;
  mode: 'bone' | 'void';
};

export const NAV: NavItem[] = [
  { id: '00', label: 'INDEX', href: '/', mode: 'void' },
  { id: '01', label: 'NOVEL', href: '/novel/', mode: 'bone' },
  { id: '02', label: 'GALLERY', href: '/gallery/', mode: 'void' },
  { id: '03', label: 'CHARACTERS', href: '/characters/', mode: 'bone' },
  { id: '04', label: 'ABOUT', href: '/about/', mode: 'bone' },
];

export function routeIndex(pathname: string): NavItem | undefined {
  // Strip Astro's base prefix if present, normalize trailing slash
  const p = pathname.replace(/\/$/, '') || '/';
  return NAV.find((n) => {
    const nh = n.href.replace(/\/$/, '') || '/';
    if (nh === '/') return p === '/' || p.endsWith('/');
    return p === nh || p.startsWith(nh + '/');
  });
}

export function modeFor(pathname: string): 'bone' | 'void' {
  const clean = pathname.replace(/\/$/, '');
  if (clean === '' || clean.endsWith('/juicetopia-website')) return 'void';
  if (clean.includes('/gallery')) return 'void';
  return 'bone';
}
