import fs from 'fs';
const path = './docs/ui-redesign-audit-inventory.md';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
let updated = false;
const marketingRoutes = ['/triage', '/a2l-resources', '/features', '/pricing', '/about', '/blog', '/blog/:slug', '/stories', '/podcasts', '/contact', '/documentation', '/help', '/privacy', '/terms', '/connect-provider', '/callback/:provider', '/career'];
const authRoutes = ['/signin', '/signup'];
const dashboardRoutes = ['/portal', '/track-job/:id', '/tech', '/tech/jobs/:id', '/dashboard/jobs', '/dashboard/jobs/:id', '/dashboard/dispatch', '/dashboard/triage', '/dashboard/fleet', '/dashboard/projects', '/dashboard/clients', '/dashboard/clients/:id'];
const toolRoutes = ['/tools/refrigerant-comparison', '/tools/cascade-cycle', '/tools/refrigerant-report', '/tools/refrigerant-inventory', '/tools/leak-rate-calculator', '/tools/warranty-scanner', '/tools/iaq-wizard'];
const settingsRoutes = ['/profile', '/settings/company', '/settings/team', '/history', '/advanced-reporting', '/troubleshooting', '/diy-calculators', '/estimate-builder', '/select-company', '/join-company', '/invite/:slug', '/create-company', '/invite-team'];
const otherRoutes = ['/stripe-debug', '/agent-sandbox', '/ai/pattern-insights', '*'];

function getPerformanceNote(route) {
  if (marketingRoutes.includes(route)) return 'Lightweight; minimal dependencies';
  if (authRoutes.includes(route)) return 'Lightweight; form dependencies';
  if (dashboardRoutes.includes(route)) return 'Moderate; includes recharts, supabase';
  if (toolRoutes.includes(route)) return 'Heavy; includes recharts, pdf-lib, complex calculations';
  if (settingsRoutes.includes(route)) return 'Moderate; form dependencies';
  return 'Lightweight; minimal dependencies';
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('| `/') && line.includes('| `@/pages/')) {
    const match = line.match(/^\| `([^`]+)` \|/);
    if (match) {
      const route = match[1];
      const columns = line.split('|').map(col => col.trim());
      // columns[7] is performance notes (0-index: 0 empty,1 route,2 component,3 file path,4 description,5 UX,6 SEO,7 performance,8 clutter)
      if (columns[7] === '') {
        const note = getPerformanceNote(route);
        columns[7] = note;
        const parts = line.split('|');
        parts[7] = ` ${note} `;
        lines[i] = parts.join('|');
        updated = true;
      }
    }
  } else if (line.startsWith('| `*`')) {
    const columns = line.split('|').map(col => col.trim());
    if (columns[7] === '') {
      const note = 'Lightweight; minimal dependencies';
      columns[7] = note;
      const parts = line.split('|');
      parts[7] = ` ${note} `;
      lines[i] = parts.join('|');
      updated = true;
    }
  }
}
if (updated) {
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Updated performance notes');
} else {
  console.log('No updates needed');
}
