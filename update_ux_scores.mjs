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

function getScore(route) {
  if (marketingRoutes.includes(route)) return 7;
  if (authRoutes.includes(route)) return 7;
  if (dashboardRoutes.includes(route)) return 6;
  if (toolRoutes.includes(route)) return 5;
  if (settingsRoutes.includes(route)) return 6;
  return 5;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('| `/') && line.includes('| `@/pages/')) {
    // Parse route (first column)
    const match = line.match(/^\| `([^`]+)` \|/);
    if (match) {
      const route = match[1];
      // Check if UX score column (5th) is empty (has spaces between pipes)
      const columns = line.split('|').map(col => col.trim());
      // columns[0] empty, columns[1] route, 2 component, 3 file path, 4 description, 5 UX score, 6 SEO, 7 performance, 8 clutter
      if (columns[5] === '') {
        const score = getScore(route);
        columns[5] = score.toString();
        // Reconstruct line preserving original spacing is tricky; we'll simple replace the cell
        // Better to replace the segment between the 5th and 6th pipes
        const parts = line.split('|');
        // parts[5] is the UX score cell (0-indexed but first is empty due to leading pipe)
        parts[5] = ` ${score} `;
        lines[i] = parts.join('|');
        updated = true;
      }
    }
  }
}
if (updated) {
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Updated UX scores');
} else {
  console.log('No updates needed');
}
