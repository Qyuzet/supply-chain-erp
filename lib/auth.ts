import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  fullname: string; // This will be derived from customername
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
      // If user doesn't exist in customers table, create them
      if (userError.code === 'PGRST116') { // No rows returned
        console.log('User not found in customers table, creating profile...');

        try {
          const newUserData = await createUserProfile(
            session.user.email!,
            session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            'customer'
          );

          return {
            id: newUserData.customerid,
            email: newUserData.email,
            fullname: newUserData.customername, // Use customername as fullname
            role: newUserData.role,
            customername: newUserData.customername,
            phone: newUserData.phone,
            address: newUserData.address,
            isactive: newUserData.isactive
          };
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          return null;
        }
      } else {
        console.error('User data error:', userError);
        return null;
      }
    }

    if (!userData) {
      console.log('No user data found');
      return null;
    }

    // Return user in expected format
    return {
      id: userData.customerid,
      email: userData.email,
      fullname: userData.customername, // Use customername as fullname
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
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
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
        customername: fullname, // Use customername instead of fullname
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

// Temporary function for testing without OAuth
export const createTestSession = async (email: string = 'admin@example.com') => {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Store user info in localStorage for testing
      if (typeof window !== 'undefined') {
        localStorage.setItem('test-user', JSON.stringify({
          id: existingUser.customerid,
          email: existingUser.email,
          fullname: existingUser.customername,
          role: existingUser.role,
          customername: existingUser.customername,
          phone: existingUser.phone,
          address: existingUser.address,
          isactive: existingUser.isactive
        }));
      }
      return existingUser;
    } else {
      throw new Error('Test user not found');
    }
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
};

// Modified getCurrentUser to check for test session
export const getCurrentUserWithTest = async (): Promise<User | null> => {
  // First try normal Supabase auth
  const normalUser = await getCurrentUser();
  if (normalUser) return normalUser;

  // If no Supabase session, check for test session
  if (typeof window !== 'undefined') {
    const testUser = localStorage.getItem('test-user');
    if (testUser) {
      try {
        return JSON.parse(testUser);
      } catch (error) {
        console.error('Error parsing test user:', error);
        localStorage.removeItem('test-user');
      }
    }
  }

  return null;
};
