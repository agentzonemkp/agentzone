import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  address?: string;
  chainId?: number;
  nonce?: string;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_iron_session',
  cookieName: 'agentzone_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function createSession(address: string, chainId: number) {
  const session = await getSession();
  session.address = address;
  session.chainId = chainId;
  session.isLoggedIn = true;
  await session.save();
  return session;
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
