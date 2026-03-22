import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            programs: {
              include: { program: true },
            },
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        const mainProgram = user.programs.find((p) => p.type === "MAIN");
        const allProgramIds = user.programs.map((p) => p.programId);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          programId: mainProgram?.programId ?? null,
          programName: mainProgram?.program.name ?? null,
          programIds: allProgramIds,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.programId = (user as unknown as { programId: string | null }).programId;
        token.programName = (user as unknown as { programName: string | null }).programName;
        token.programIds = (user as unknown as { programIds: string[] }).programIds ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.programId = token.programId as string | null;
        session.user.programName = token.programName as string | null;
        session.user.programIds = (token.programIds as string[]) ?? [];
      }
      return session;
    },
  },
};
