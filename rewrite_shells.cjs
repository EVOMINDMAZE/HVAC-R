const fs = require('fs');
const path = require('path');

const files = [
  'client/pages/Documentation.tsx',
  'client/pages/Podcasts.tsx',
  'client/pages/BlogPost.tsx',
  'client/pages/TermsOfService.tsx',
  'client/pages/SignUp.tsx',
  'client/pages/Blog.tsx',
  'client/pages/public/Triage.tsx',
  'client/pages/WebStories.tsx',
  'client/pages/Privacy.tsx',
  'client/pages/A2LLandingPage.tsx',
  'client/pages/Callback.tsx',
  'client/pages/NotFound.tsx',
  'client/pages/SignIn.tsx',
  'client/pages/Career.tsx'
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('PublicPageShell')) {
      // Add import if missing
      content = content.replace(/(import { [^}]+ } from "lucide-react";\n)/, '$1import { PublicPageShell } from "@/components/public/PublicPageShell";\n');
      if (!content.includes('PublicPageShell')) {
         content = content.replace(/(import.*["'].*["'];\n)/, '$1import { PublicPageShell } from "@/components/public/PublicPageShell";\n');
      }
  }

  // Replace wrapper open
  content = content.replace(/<div className="app-shell min-h-screen bg-background text-foreground">/g, '<PublicPageShell mainId="main-content" withFooter={false}>');
  
  // Try to remove explicit Footer and Header calls if they exist, since PublicPageShell handles Header
  content = content.replace(/<Header [^>]*\/>\n/g, '');
  content = content.replace(/<Header\s*\/>\n/g, '');
  
  // If the file explicitly included a <Footer />, we should re-enable it in PublicPageShell
  if (content.includes('<Footer />')) {
      content = content.replace(/<PublicPageShell mainId="main-content" withFooter={false}>/g, '<PublicPageShell mainId="main-content">');
      content = content.replace(/<Footer \/>\n/g, '');
  }

  // Find the last </div> that was closing the app-shell and replace it with </PublicPageShell>
  // This is tricky with regex, so let's do a simple replace of the last occurrence
  const lastDivIndex = content.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    content = content.substring(0, lastDivIndex) + '</PublicPageShell>' + content.substring(lastDivIndex + 6);
  }

  fs.writeFileSync(filePath, content);
}
console.log('Done rewriting files.');
