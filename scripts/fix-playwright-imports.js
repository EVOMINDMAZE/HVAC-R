#!/usr/bin/env node
/**
 * Fix Playwright test imports for v1.40+ compatibility
 * 
 * In Playwright v1.40+, `describe`, `beforeAll`, `afterAll` are no longer
 * exported from '@playwright/test'. Use `test.describe`, `test.beforeAll`, etc.
 */

import fs from 'fs';
import path from 'path';

const e2eDir = path.join(process.cwd(), 'e2e');

// Find all spec files
const specFiles = [];
function findSpecFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSpecFiles(fullPath);
    } else if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.js')) {
      specFiles.push(fullPath);
    }
  }
}

findSpecFiles(e2eDir);

console.log(`Found ${specFiles.length} spec files`);

for (const filePath of specFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix import lines
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@playwright\/test['"]/g;
  const importMatch = importRegex.exec(content);
  if (importMatch) {
    const imports = importMatch[1].trim();
    const importList = imports.split(',').map(s => s.trim());
    
    // Remove describe, beforeAll, afterAll from imports
    const filteredImports = importList.filter(imp => 
      !['describe', 'beforeAll', 'afterAll'].includes(imp)
    );
    
    if (filteredImports.length !== importList.length) {
      const newImport = `import { ${filteredImports.join(', ')} } from '@playwright/test'`;
      content = content.replace(importMatch[0], newImport);
      modified = true;
      console.log(`✅ Fixed imports in ${path.relative(process.cwd(), filePath)}`);
    }
  }
  
  // Replace standalone describe( with test.describe(
  // Only replace if not already prefixed with test. or something else
  const describeRegex = /(?<!(test\.|\.))describe\(/g;
  if (describeRegex.test(content)) {
    content = content.replace(describeRegex, 'test.describe(');
    modified = true;
    console.log(`✅ Fixed describe() calls in ${path.relative(process.cwd(), filePath)}`);
  }
  
  // Replace standalone beforeAll( with test.beforeAll(
  const beforeAllRegex = /(?<!(test\.|\.))beforeAll\(/g;
  if (beforeAllRegex.test(content)) {
    content = content.replace(beforeAllRegex, 'test.beforeAll(');
    modified = true;
    console.log(`✅ Fixed beforeAll() calls in ${path.relative(process.cwd(), filePath)}`);
  }
  
  // Replace standalone afterAll( with test.afterAll(
  const afterAllRegex = /(?<!(test\.|\.))afterAll\(/g;
  if (afterAllRegex.test(content)) {
    content = content.replace(afterAllRegex, 'test.afterAll(');
    modified = true;
    console.log(`✅ Fixed afterAll() calls in ${path.relative(process.cwd(), filePath)}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('\n🎉 All Playwright imports fixed!');