import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authApi } from "./api";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { access_token } = await authApi.login({
            email: credentials.email as string,
            password: credentials.password as string,
          });
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/me`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          const user = await res.json();
          return { id: String(user.id), email: user.email, name: user.name, token: access_token };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.token) token.accessToken = (user as { token: string }).token;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
});
