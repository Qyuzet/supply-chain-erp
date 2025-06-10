import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '@/lib/supabase';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          console.log('Google sign in successful for:', user.email);

          // Check if user exists in our database
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking user:', fetchError);
            return false;
          }

          // If user doesn't exist, create them
          if (!existingUser) {
            console.log('Creating new user:', user.email);

            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                userid: crypto.randomUUID(),
                email: user.email!,
                passwordhash: '', // Not used for OAuth
                fullname: user.name,
                role: 'customer', // Default role
                isactive: true,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating user:', insertError);
              return false;
            }

            // Create customer profile for new users
            if (newUser) {
              const { error: customerError } = await supabase
                .from('customers')
                .insert({
                  customerid: crypto.randomUUID(),
                  userid: newUser.userid,
                  customername: user.name,
                });

              if (customerError) {
                console.error('Error creating customer profile:', customerError);
                // Don't fail login if customer profile creation fails
              }
            }
          } else {
            console.log('Existing user found:', existingUser.email);
          }

          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch user data from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (userData && !error) {
          token.role = userData.role;
          token.userId = userData.userid;
          token.fullName = userData.fullname;
          token.isActive = userData.isactive;
        } else {
          // Fallback values
          token.role = 'customer';
          token.userId = user.id;
          token.fullName = user.name;
          token.isActive = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string || 'customer';
        session.user.userId = token.userId as string;
        session.user.fullName = token.fullName as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
