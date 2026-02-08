import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function processBaseline() {
    const inputPath = join(process.cwd(), 'supabase/migrations/0001_initial_schema_noauth.sql');
    const outputPath = join(process.cwd(), 'supabase/migrations/0001_initial_schema_processed.sql');
    
    console.log(`Reading ${inputPath}...`);
    let sql = await readFile(inputPath, 'utf8');
    
    // 1. Replace CREATE SCHEMA with IF NOT EXISTS
    sql = sql.replace(/CREATE SCHEMA public;/g, 'CREATE SCHEMA IF NOT EXISTS public;');
    sql = sql.replace(/CREATE SCHEMA storage;/g, 'CREATE SCHEMA IF NOT EXISTS storage;');
    
    // 2. Replace CREATE TABLE with IF NOT EXISTS (single line pattern)
    // Note: pg_dump outputs CREATE TABLE on one line, then column definitions on subsequent lines.
    // We'll match "CREATE TABLE public.table_name (" and replace with "CREATE TABLE IF NOT EXISTS public.table_name ("
    // Use regex that captures schema and table name.
    sql = sql.replace(/CREATE TABLE (public|storage)\.(\w+) \(/g, 'CREATE TABLE IF NOT EXISTS $1.$2 (');
    
    // 3. Replace CREATE INDEX with IF NOT EXISTS
    sql = sql.replace(/CREATE INDEX (public|storage)\.(\w+) ON/g, 'CREATE INDEX IF NOT EXISTS $1.$2 ON');
    sql = sql.replace(/CREATE UNIQUE INDEX (public|storage)\.(\w+) ON/g, 'CREATE UNIQUE INDEX IF NOT EXISTS $1.$2 ON');
    
    // 4. Replace CREATE TRIGGER with IF NOT EXISTS (PostgreSQL doesn't support IF NOT EXISTS for triggers)
    // We'll skip; triggers may fail if already exist. We'll rely on check_function_bodies = false? Not enough.
    // We'll wrap trigger creation in a DO block later.
    
    // 5. Replace CREATE FUNCTION with OR REPLACE (since we want idempotent functions)
    // pg_dump already uses CREATE OR REPLACE for functions? Let's check.
    // We'll replace "CREATE FUNCTION" with "CREATE OR REPLACE FUNCTION" if not already.
    sql = sql.replace(/CREATE FUNCTION (?!OR REPLACE)/g, 'CREATE OR REPLACE FUNCTION');
    
    // 6. Replace CREATE POLICY with IF NOT EXISTS (PostgreSQL 15+ supports IF NOT EXISTS)
    // We'll add IF NOT EXISTS after CREATE POLICY.
    sql = sql.replace(/CREATE POLICY (\w+) ON (public|storage)\.(\w+)/g, 'CREATE POLICY IF NOT EXISTS $1 ON $2.$3');
    
    // 7. Replace CREATE VIEW with IF NOT EXISTS
    sql = sql.replace(/CREATE VIEW (public|storage)\.(\w+) AS/g, 'CREATE OR REPLACE VIEW $1.$2 AS');
    
    // 8. Replace ALTER TABLE ADD COLUMN with IF NOT EXISTS (requires DO block, skip for now)
    
    console.log(`Writing processed SQL to ${outputPath}...`);
    await writeFile(outputPath, sql);
    console.log('Done.');
}

processBaseline().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});