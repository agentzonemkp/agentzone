// Embedding service using OpenAI text-embedding-3-small
// Stores vectors in separate JSON files (Turso doesn't support pgvector)

import fs from 'fs/promises';
import path from 'path';

const EMBEDDINGS_DIR = path.join(process.cwd(), 'data', 'embeddings');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface EmbeddingRecord {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: string;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function storeEmbedding(
  id: string,
  text: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  await fs.mkdir(EMBEDDINGS_DIR, { recursive: true });

  const embedding = await generateEmbedding(text);

  const record: EmbeddingRecord = {
    id,
    text,
    embedding,
    metadata,
    createdAt: new Date().toISOString(),
  };

  const filepath = path.join(EMBEDDINGS_DIR, `${id}.json`);
  await fs.writeFile(filepath, JSON.stringify(record, null, 2));
}

export async function cosineSimilarity(a: number[], b: number[]): Promise<number> {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchSimilar(
  query: string,
  topK = 5,
  threshold = 0.7
): Promise<Array<{ id: string; text: string; score: number; metadata: Record<string, any> }>> {
  const queryEmbedding = await generateEmbedding(query);

  // Load all embeddings
  await fs.mkdir(EMBEDDINGS_DIR, { recursive: true });
  const files = await fs.readdir(EMBEDDINGS_DIR);

  const results: Array<{
    id: string;
    text: string;
    score: number;
    metadata: Record<string, any>;
  }> = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const content = await fs.readFile(path.join(EMBEDDINGS_DIR, file), 'utf-8');
    const record: EmbeddingRecord = JSON.parse(content);

    const score = await cosineSimilarity(queryEmbedding, record.embedding);

    if (score >= threshold) {
      results.push({
        id: record.id,
        text: record.text,
        score,
        metadata: record.metadata,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}
