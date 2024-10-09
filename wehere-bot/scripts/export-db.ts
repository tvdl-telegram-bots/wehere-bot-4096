// npx ts-node --skipProject wehere-bot/scripts/export-db.ts

import * as fs from "fs/promises";
import * as path from "path";

import * as $ from "@inquirer/prompts";
import { MongoClient, type Db } from "mongodb";

async function backupDatabase(
  db: Db,
  outputDir: string,
  collectionNames: string[]
) {
  await fs.mkdir(outputDir, { recursive: true });

  for (const c of collectionNames) {
    console.log(`Backing up collection: ${c}`);
    const filePath = path.join(outputDir, `${c}.jsonl`);
    const fileHandle = await fs.open(filePath, "w");

    try {
      for await (const doc of db.collection(c).find()) {
        await fileHandle.write(`${JSON.stringify(doc)}\n`);
      }
    } finally {
      await fileHandle.close();
    }
  }
}

async function main() {
  const uri = await $.input({
    message: "Connection string\n ",
    required: true,
    validate: (value) => value === value.trim() && value.startsWith("mongo"),
  });

  const databaseName = await $.input({
    message: "Database name\n ",
    required: true,
    validate: (value) => value === value.trim() && !!value,
  });

  const client = await MongoClient.connect(uri);
  const db = client.db(databaseName);

  try {
    const collections = await db.collections();
    const collectionNames = collections.map((c) => c.collectionName);
    collectionNames.sort();

    const selectedCollections = await $.checkbox<string>({
      message: "Collections\n ",
      choices: collectionNames,
      validate: (value) =>
        value.length > 0 || "You must select at least one collection",
    });

    const outputDir = await $.input({
      message: "Output dir\n ",
      required: true,
      validate: (value) => value === value.trim() && !!value,
    });

    await backupDatabase(db, outputDir, selectedCollections);
  } finally {
    await client.close();
  }
}

main()
  .then(() => {
    console.log("Done.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
