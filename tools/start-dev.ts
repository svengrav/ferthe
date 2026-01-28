#!/usr/bin/env -S deno run --allow-all

import { spawn } from "node:child_process";

const processes: Array<ReturnType<typeof spawn>> = [];

function startProcess(name: string, cmd: string, args: string[], cwd?: string) {
  console.log(`[${name}] Starting...`);
  const proc = spawn(cmd, args, {
    cwd: cwd || Deno.cwd(),
    stdio: "inherit",
    shell: true,
    detached: false,
  });

  proc.on("error", (err) => console.error(`[${name}] Error:`, err));
  processes.push(proc);
  return proc;
}

// Start Storage Server
startProcess("Storage", "deno", ["run", "--allow-all", "./tools/localStorageServer.ts"]);

// Wait a bit for storage server to start
await new Promise(resolve => setTimeout(resolve, 2000));

// Start API Server
startProcess("API", "deno", ["run", "-A", "--watch=.", "api/index.ts"], "./packages/core")  

// Start Expo Web Server
startProcess("App", "npm", ["run", "dev"], "./packages/app");

// Keep alive
await new Promise(() => { });
