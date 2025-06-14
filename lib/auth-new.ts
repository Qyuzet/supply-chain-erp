import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  fullname: string;
  role: string;
  customername?: string;
  phone?: string;
  address?: string;
  isactive: boolean;
}

// Updated authentication functions for new schema
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Get current session from Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }

    if (!session?.user) {
      console.log('No active session');
      return null;
    }

    // Get user data from customers table (unified user table)
    const { data: userData, error: userError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return null;
    }

    if (!userData) {
      console.log('No user data found');
      return null;
    }

    // Return user in expected format
    return {
      id: userData.customerid,
      email: userData.email,
      fullname: userData.fullname || userData.customername,
      role: userData.role,
      customername: userData.customername,
      phone: userData.phone,
      address: userData.address,
      isactive: userData.isactive
    };

  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  fullname: string,
  role: string = 'customer'
) => {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    if (authData.user) {
      // Then create user profile in customers table
      const { data: profileData, error: profileError } = await supabase
        .from('customers')
        .insert({
          email,
          fullname,
          customername: fullname,
          role,
          phone: '+1 (555) 000-0000',
          address: '123 Main St, City, State 12345',
          isactive: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here, auth user was created successfully
      }

      return { authData, profileData };
    }

    return { authData, profileData: null };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Helper function to create user profile after OAuth
export const createUserProfile = async (
  email: string,
  fullname: string,
  role: string = 'customer'
) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email,
        fullname,
        customername: fullname,
        role,
        phone: '+1 (555) 000-0000',
        address: '123 Main St, City, State 12345',
        isactive: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Profile creation error:', error);
    throw error;
  }
};

// Check if user exists in customers table
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('customerid')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Get users by role (for admin functions)
export const getUsersByRole = async (role: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('role', role)
      .order('createdat', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

// Update user role (admin function)
export const updateUserRole = async (userId: string, newRole: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({ role: newRole })
      .eq('customerid', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};
