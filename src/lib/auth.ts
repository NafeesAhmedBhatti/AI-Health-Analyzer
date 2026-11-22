import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const hasMysqlUrl = () => Boolean(process.env.DATABASE_URL?.startsWith('mysql://'));

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // Instant Demo Account (always works)
        if (email === 'demo@aihealth.app' && password === 'DemoPass123!') {
          return { id: 'demo_user_001', email, name: 'Nafees Demo' };
        }

        // Try MySQL Prisma database if configured
        if (hasMysqlUrl()) {
          try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              const isValid = await bcrypt.compare(password, user.passwordHash);
              if (!isValid) return null;
              return { id: user.id, email: user.email, name: user.name };
            }
          } catch (err) {
            console.warn('[Auth] Database lookup unavailable, using stateless fallback:', err);
          }
        }

        // Stateless fallback when no external MySQL DB is attached on Vercel
        if (!hasMysqlUrl() && password.length >= 8) {
          const nameFromEmail = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return { id: `guest_${Buffer.from(email).toString('hex').slice(0, 12)}`, email, name: nameFromEmail || 'Health User' };
        }

        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'ai-health-analyzer-jwt-secret-key',
};
