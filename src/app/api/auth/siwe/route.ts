import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { createSession, getSession, destroySession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Verify nonce matches session
    const session = await getSession();
    if (session.nonce !== siweMessage.nonce) {
      return NextResponse.json({ error: 'Nonce mismatch' }, { status: 401 });
    }

    // Create authenticated session
    await createSession(siweMessage.address, siweMessage.chainId);

    return NextResponse.json({
      success: true,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
    });
  } catch (error) {
    console.error('SIWE verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
