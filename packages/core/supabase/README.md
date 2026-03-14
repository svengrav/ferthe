# PostgreSQL Database Setup (Supabase)

## Setup

### Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Create Supabase Project


```bash
# Export from old and import to new (example)
# set to core/
supabase link --project-ref lzrtdpybunfjjnrrucyq 
supabase db dump -f ./supabase/schema.sql --schema public

# Import to dev
supabase link --project-ref jtmzjzzcrtzkfbpwdbxm
supabase db push --db-url "postgresql://postgres:[password]@[dev-host]:5432/postgres
```
