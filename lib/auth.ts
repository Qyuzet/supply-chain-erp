import { getSession } from 'next-auth/react';
import { supabase } from './supabase';
import type { UserRole } from './supabase';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
}

export const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'customer') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) throw error;

  // Create user record in our users table
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .insert({
        userid: data.user.id,
        email: data.user.email!,
        fullname: fullName,
        role: role,
      });

    if (userError) throw userError;

    // Create role-specific profile
    if (role === 'customer') {
      await supabase
        .from('customers')
        .insert({
          userid: data.user.id,
          customername: fullName,
        });
    } else if (role === 'supplier') {
      await supabase
        .from('supplier')
        .insert({
          userid: data.user.id,
          suppliername: fullName,
        });
    }
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  // Use NextAuth signOut instead of Supabase auth
  const { signOut: nextAuthSignOut } = await import('next-auth/react');
  await nextAuthSignOut({ redirect: false });
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('Getting current user from NextAuth session...');
    const session = await getSession();

    if (!session?.user) {
      console.log('No authenticated user found');
      return null;
    }

    console.log('Authenticated user found:', session.user.email);

    // Get fresh user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // If user doesn't exist in our users table, return session data as fallback
      if (userError.code === 'PGRST116') {
        console.log('User not found in users table, using session data');
        return {
          id: session.user.userId || session.user.id || 'temp-id',
          email: session.user.email || '',
          fullName: session.user.fullName || session.user.name || undefined,
          role: (session.user.role as UserRole) || 'customer',
        };
      }
      throw userError;
    }

    if (!userData) {
      console.log('No user data found in users table');
      return null;
    }

    console.log('User data found:', userData);

    return {
      id: userData.userid,
      email: userData.email,
      fullName: userData.fullname || undefined,
      role: userData.role,
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    throw error;
  }
};