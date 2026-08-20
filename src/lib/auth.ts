import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            employee: { include: { office: true } },
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          },
        });
        if (!user || user.status !== 'Active') return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const permissions = new Set<string>();
        const roleNames: string[] = [];
        for (const ur of user.roles) {
          roleNames.push(ur.role.name);
          for (const rp of ur.role.permissions) {
            permissions.add(rp.permission.name);
          }
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.photoUrl ?? undefined,
          roles: roleNames,
          permissions: Array.from(permissions),
          employeeId: user.employeeId ?? undefined,
          officeId: user.employee?.officeId ?? undefined,
          officeName: user.employee?.office?.officeName ?? undefined,
        } as any;
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  secret: process.env.NEXTAUTH_SECRET || 'educare-crm-dev-secret-change-in-prod',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.employeeId = (user as any).employeeId;
        token.officeId = (user as any).officeId;
        token.officeName = (user as any).officeName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles;
        (session.user as any).permissions = token.permissions;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).officeId = token.officeId;
        (session.user as any).officeName = token.officeName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      roles: string[];
      permissions: string[];
      employeeId?: string;
      officeId?: string;
      officeName?: string;
    };
  }
}
