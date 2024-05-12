#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const content = readFileSync(process.stdin.fd, "utf-8");
writeFileSync(process.stdout.fd, JSON.stringify(content), "utf-8");
