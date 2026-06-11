/**
 * One-time migration: imports JSON files from /data into MongoDB.
 *
 * Usage:
 *   npx tsx src/scripts/migrate-to-mongo.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { AccountModel } from '../lib/model/Account';
import { TemplateModel } from '../lib/model/Template';
import { CampaignModel } from '../lib/model/Campaign';
import { UploadModel } from '../lib/model/Upload';
import { HistoryModel } from '../lib/model/History';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

async function readJson<T>(filename: string): Promise<T[]> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateCollection<T extends { id: string }>(
  filename: string,
  Model: mongoose.Model<T>,
  label: string
) {
  const items = await readJson<T>(filename);

  if (items.length === 0) {
    console.log(`[${label}] no records found in ${filename}, skipping`);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    const exists = await Model.findOne({ id: item.id });
    if (exists) {
      skipped++;
      continue;
    }
    await Model.create(item);
    inserted++;
  }

  console.log(`[${label}] inserted ${inserted}, skipped ${skipped} (already existed)`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await migrateCollection('accounts.json', AccountModel, 'accounts');
  await migrateCollection('templates.json', TemplateModel, 'templates');
  await migrateCollection('campaigns.json', CampaignModel, 'campaigns');
  await migrateCollection('uploads.json', UploadModel, 'uploads');
  await migrateCollection('history.json', HistoryModel, 'history');

  await mongoose.disconnect();
  console.log('Migration complete');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});