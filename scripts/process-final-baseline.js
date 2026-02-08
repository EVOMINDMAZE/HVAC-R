import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function processBaseline() {
    const inputPath = join(process.cwd(), 'supabase/migrations/0001_initial_schema_public_only.sql');
    const outputPath = join(process.cwd(), 'supabase/migrations/0001_initial_schema.sql');
    
    console.log(`Reading ${inputPath}...`);
    let sql = await readFile(inputPath, 'utf8');
    
    // 1. Replace CREATE SCHEMA with IF NOT EXISTS
    sql = sql.replace(/CREATE SCHEMA public;/g, 'CREATE SCHEMA IF NOT EXISTS public;');
    
    // 2. Replace CREATE TABLE with IF NOT EXISTS
    // Pattern: CREATE TABLE public.table_name (
    sql = sql.replace(/CREATE TABLE public\.(\w+) \(/g, 'CREATE TABLE IF NOT EXISTS public.$1 (');
    
    // 3. Replace CREATE INDEX with IF NOT EXISTS
    // Pattern: CREATE INDEX index_name ON public.table_name
    // Need to capture index name (may contain underscores) and table name.
    // We'll use a more robust regex that matches the whole line up to ON.
    // Since we cannot parse multiline easily, we'll assume each CREATE INDEX is on a single line.
    sql = sql.replace(/CREATE INDEX (\w+) ON public\.(\w+)/g, 'CREATE INDEX IF NOT EXISTS $1 ON public.$2');
    
    // 4. Replace CREATE UNIQUE INDEX similarly
    sql = sql.replace(/CREATE UNIQUE INDEX (\w+) ON public\.(\w+)/g, 'CREATE UNIQUE INDEX IF NOT EXISTS $1 ON public.$2');
    
    // 5. Replace CREATE POLICY with IF NOT EXISTS
    sql = sql.replace(/CREATE POLICY "([^"]+)" ON public\.(\w+)/g, 'CREATE POLICY IF NOT EXISTS "$1" ON public.$2');
    
    // 6. Replace CREATE FUNCTION with CREATE OR REPLACE FUNCTION (ensure space)
    // Pattern: CREATE FUNCTION public.func_name
    sql = sql.replace(/CREATE FUNCTION (public\.\w+)/g, 'CREATE OR REPLACE FUNCTION $1');
    
    // 7. Replace CREATE TRIGGER with CREATE OR REPLACE TRIGGER? Not supported.
    // We'll leave as is; may fail if trigger exists.
    // 8. Replace CREATE VIEW with CREATE OR REPLACE VIEW
    sql = sql.replace(/CREATE VIEW public\.(\w+) AS/g, 'CREATE OR REPLACE VIEW public.$1 AS');
    
    // 9. Replace CREATE TYPE with CREATE TYPE IF NOT EXISTS? Not supported.
    // We'll leave as is; they are unique enum types.
    
    console.log(`Writing processed SQL to ${outputPath}...`);
    await writeFile(outputPath, sql);
    console.log('Done.');
}

processBaseline().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});