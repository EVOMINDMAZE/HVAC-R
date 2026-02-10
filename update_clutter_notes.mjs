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

function getClutterNote(route) {
  if (marketingRoutes.includes(route)) return 'Excessive decorative elements, gradient backgrounds, excessive animations; need simplification and focus on core messaging.';
  if (authRoutes.includes(route)) return 'Minimal clutter; could improve visual hierarchy.';
  if (dashboardRoutes.includes(route)) return 'Overwhelming data density, too many cards, badges, alerts; need consolidation and prioritization.';
  if (toolRoutes.includes(route)) return 'Extreme complexity, too many input controls, tabs, visualizations; need streamlined workflow and progressive disclosure.';
  if (settingsRoutes.includes(route)) return 'Functional but cluttered forms; need grouping and visual hierarchy.';
  return 'Minimal clutter.';
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('| `/') && line.includes('| `@/pages/')) {
    const match = line.match(/^\| `([^`]+)` \|/);
    if (match) {
      const route = match[1];
      const columns = line.split('|').map(col => col.trim());
      // columns[8] is clutter assessment (0-index: 0 empty,1 route,2 component,3 file path,4 description,5 UX,6 SEO,7 performance,8 clutter)
      if (columns[8] === '') {
        const note = getClutterNote(route);
        columns[8] = note;
        const parts = line.split('|');
        parts[8] = ` ${note} `;
        lines[i] = parts.join('|');
        updated = true;
      }
    }
  } else if (line.startsWith('| `*`')) {
    const columns = line.split('|').map(col => col.trim());
    if (columns[8] === '') {
      const note = 'Minimal clutter.';
      columns[8] = note;
      const parts = line.split('|');
      parts[8] = ` ${note} `;
      lines[i] = parts.join('|');
      updated = true;
    }
  }
}
if (updated) {
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Updated clutter notes');
} else {
  console.log('No updates needed');
}
