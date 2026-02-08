# Supabase CLI Guide: Local Docker Development & Cloud Operations

This guide covers Supabase CLI usage for both local Docker-based development and cloud project management.

## Local Docker Development

### Prerequisites
- Docker installed and running
- Supabase CLI: `npm install -g supabase`

### 1. Start Local Supabase Environment
Starts Docker containers for database, auth, storage, and Studio.
```bash
supabase start
```
**Expected Output**: Services running on:
- Database: `localhost:54322`
- API: `localhost:54321`
- Studio: `localhost:54323`
- Auth: `localhost:54324`

### 2. Stop Local Environment
```bash
supabase stop
```

### 3. Check Local Status
```bash
supabase status
```

### 4. Reset Local Database
Resets the local Docker database to a clean state (does NOT affect cloud).
```bash
supabase db reset
```

### 5. Local Development Configuration
For local development, configure `.env` with:
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

## Cloud Project Operations

### Working Connection Parameters
- **Project Ref**: `rxqflxmzsqhqrzffcsej`
- **Region**: `us-east-2`
- **Database Port**: `6543` (Supavisor Transaction Mode)
- **DNS Resolver**: `https` (using Cloudflare 1.1.1.1)

### 1. Link to Cloud Project
```bash
supabase login
supabase link --project-ref rxqflxmzsqhqrzffcsej
```

### 2. Push Local Migrations to Cloud
Apply your `supabase/migrations/*.sql` files to the remote database.
```bash
npx supabase db push --db-url "postgresql://postgres.rxqflxmzsqhqrzffcsej:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" --dns-resolver https
```

### 3. Pull Remote Changes
Sync your local schema with changes made directly in the Supabase Dashboard.
```bash
npx supabase db pull --db-url "postgresql://postgres.rxqflxmzsqhqrzffcsej:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" --dns-resolver https
```

### 4. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific functions
supabase functions deploy ai-gateway ai-troubleshoot
```

### 5. Check Cloud Connection Status
```bash
npx supabase db remote pull --db-url "postgresql://postgres.rxqflxmzsqhqrzffcsej:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" --dns-resolver https
```

## Development Workflow

### Typical Development Cycle
1. **Start Local Environment**: `supabase start`
2. **Develop Locally**: Use `localhost:54321` in `.env`
3. **Create Migrations**: Add SQL files to `supabase/migrations/`
4. **Test Locally**: Verify changes work with local Docker
5. **Push to Cloud**: `supabase db push` (when ready for production)
6. **Deploy Functions**: `supabase functions deploy`

### Environment Configuration
- **Development**: `.env` with `localhost:54321`
- **Production**: `.env` with cloud URL `https://rxqflxmzsqhqrzffcsej.supabase.co`

---

**Note**: Replace `[PASSWORD]` with your database password found in the `.env` file (`SUPABASE_DB_PASSWORD`).