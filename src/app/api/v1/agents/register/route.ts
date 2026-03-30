import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

// Register or update an agent's service listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet_address,
      name,
      description,
      category,
    } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
    }

    const walletLower = wallet_address.toLowerCase();

    // Check if agent exists
    const existing = await turso.execute({
      sql: 'SELECT wallet_address FROM agents_unified WHERE wallet_address = ?',
      args: [walletLower],
    });

    if (existing.rows.length > 0) {
      // Update
      await turso.execute({
        sql: `UPDATE agents_unified 
              SET name = COALESCE(?, name),
                  description = COALESCE(?, description),
                  category = COALESCE(?, category)
              WHERE wallet_address = ?`,
        args: [name || null, description || null, category || null, walletLower],
      });

      return NextResponse.json({
        success: true,
        wallet_address: walletLower,
        message: 'Agent updated',
      });
    } else {
      // Insert
      await turso.execute({
        sql: `INSERT INTO agents_unified (
                wallet_address, name, description, category,
                has_erc8004, has_x402, trust_score, composite_score
              ) VALUES (?, ?, ?, ?, 0, 0, 0, 0)`,
        args: [
          walletLower,
          name || `Agent ${wallet_address.slice(0, 8)}`,
          description || '',
          category || 'General',
        ],
      });

      return NextResponse.json({
        success: true,
        wallet_address: walletLower,
        message: 'Agent registered',
      });
    }
  } catch (error: any) {
    console.error('Error registering agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - list registered agent by wallet
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 });
  }

  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM agents_unified WHERE wallet_address = ?',
      args: [wallet],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Agent not registered' }, { status: 404 });
    }

    const row = result.rows[0];
    
    return NextResponse.json({
      agent: {
        wallet_address: String(row.wallet_address),
        name: String(row.name || ''),
        description: String(row.description || ''),
        category: String(row.category || ''),
        trust_score: Number(row.trust_score) || 0,
        has_erc8004: Boolean(row.has_erc8004),
        has_x402: Boolean(row.has_x402),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
