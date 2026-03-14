# Supabase (POSTGRES)

```
# Install Supabase CLI
#!/usr/bin/env bash
set -e

wget -q https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
sudo mv supabase /usr/local/bin/
rm supabase_linux_amd64.tar.gz

supabase --version

# 2. Login
supabase login

# 3. Mit deinem Projekt verbinden
cd /root/workspace/ferthe/packages/core
supabase link --project-ref lzrtdpybunfjjnrrucyq (https://supabase.com/dashboard/project/lzrtdpybunfjjnrrucyq)
# Project-Ref findest du im Dashboard unter Settings → General → Reference ID

# 4. Schema anwenden
cd database
cat schema/01_extensions.sql schema/02_tables.sql schema/03_indexes.sql schema/04_functions.sql | \
supabase db execute
```