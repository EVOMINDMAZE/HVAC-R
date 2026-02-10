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
const pagesWithSEO = ['/', '/features', '/dashboard']; // routes that import SEO component

function getSEOScore(route) {
  if (pagesWithSEO.includes(route)) return 7;
  if (marketingRoutes.includes(route)) return 5;
  if (authRoutes.includes(route)) return 4;
  if (dashboardRoutes.includes(route)) return 4;
  if (toolRoutes.includes(route)) return 4;
  if (settingsRoutes.includes(route)) return 3;
  return 3;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('| `/') && line.includes('| `@/pages/')) {
    const match = line.match(/^\| `([^`]+)` \|/);
    if (match) {
      const route = match[1];
      const columns = line.split('|').map(col => col.trim());
      // columns[6] is SEO score (0-index: 0 empty,1 route,2 component,3 file path,4 description,5 UX,6 SEO,7 performance,8 clutter)
      if (columns[6] === '') {
        const score = getSEOScore(route);
        columns[6] = score.toString();
        const parts = line.split('|');
        parts[6] = ` ${score} `;
        lines[i] = parts.join('|');
        updated = true;
      }
    }
  } else if (line.startsWith('| `*`')) {
    // handle 404 route
    const columns = line.split('|').map(col => col.trim());
    if (columns[6] === '') {
      const score = 3;
      columns[6] = score.toString();
      const parts = line.split('|');
      parts[6] = ` ${score} `;
      lines[i] = parts.join('|');
      updated = true;
    }
  }
}
if (updated) {
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Updated SEO scores');
} else {
  console.log('No updates needed');
}
