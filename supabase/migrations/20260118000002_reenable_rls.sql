-- Re-enable RLS on companies and clients tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
