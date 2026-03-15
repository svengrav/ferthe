# Supabase Setup & Migrations

Configure and manage Supabase databases using the CLI. This guide covers installation, project linking, schema deployment, and database migrations.

## Installation

### Install Supabase CLI

```bash
#!/usr/bin/env bash
set -e

sudo rm /usr/local/bin/supabase
rm -rf supabase
wget -q https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
sudo mv supabase /usr/local/bin/
rm supabase_linux_amd64.tar.gz
supabase --version
```

## Project Setup

### Link Project to Repository

**Steps:**

1. Authenticate with Supabase:

```bash
supabase login
```

2. Connect to the project:

```bash
cd /root/workspace/ferthe/packages/core
supabase link --project-ref lzrtdpybunfjjnrrucyq
```

3. Find project reference in Supabase Dashboard:
   - Navigate to Settings → General → Reference ID

### Deploy Database Schema

Apply schema files in order:

```bash
cd database
cat schema/01_extensions.sql schema/02_tables.sql schema/03_indexes.sql schema/04_functions.sql | \
supabase db execute
```

## Migrations

Push database changes:

```bash
supabase db push
```