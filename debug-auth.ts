// Debug script untuk auth issues
import { supabase } from './lib/supabase';

export const debugAuth = async () => {
  console.log('🔍 DEBUG: Starting auth debug...');
  
  try {
    // 1. Check Supabase connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError);
      return { success: false, error: 'Supabase connection failed' };
    } else {
      console.log('✅ Supabase connection successful');
    }

    // 2. Check current session
    console.log('2️⃣ Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (session) {
      console.log('✅ Active session found:', {
        user: session.user.email,
        expires: session.expires_at
      });
    } else {
      console.log('ℹ️ No active session');
    }

    // 3. Check customers table
    console.log('3️⃣ Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customerid, email, role, customername')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Customers table error:', customersError);
    } else {
      console.log('✅ Customers table accessible:', customers?.length || 0, 'users found');
      customers?.forEach(customer => {
        console.log(`   - ${customer.email} (${customer.role})`);
      });
    }

    // 4. Test auth flow
    console.log('4️⃣ Testing auth flow...');
    if (session?.user?.email) {
      const { data: userData, error: userError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (userError) {
        if (userError.code === 'PGRST116') {
          console.log('ℹ️ User not found in customers table - would create profile');
        } else {
          console.error('❌ User lookup error:', userError);
        }
      } else {
        console.log('✅ User profile found:', {
          id: userData.customerid,
          email: userData.email,
          role: userData.role
        });
      }
    }

    // 5. Check environment variables
    console.log('5️⃣ Checking environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('✅ Environment variables:', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
      key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing'
    });

    return { 
      success: true, 
      session: !!session,
      userCount: customers?.length || 0
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    return { success: false, error: error };
  }
};

// Function to clear all auth state
export const clearAuthState = async () => {
  console.log('🧹 Clearing all auth state...');
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    console.log('✅ Auth state cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
    return { success: false, error };
  }
};

// Function to test Google OAuth
export const testGoogleAuth = async () => {
  console.log('🔐 Testing Google OAuth...');

  try {
    // First check if Google provider is enabled
    console.log('Checking Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('❌ Google OAuth error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code || 'No code'
      });
      return { success: false, error };
    }

    console.log('✅ Google OAuth initiated');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Google OAuth test error:', error);
    return { success: false, error };
  }
};

// Function to check auth providers
export const checkAuthProviders = async () => {
  console.log('🔍 Checking available auth providers...');

  try {
    // This is a workaround to check if providers are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    });

    if (response.ok) {
      const settings = await response.json();
      console.log('✅ Auth settings:', settings);
      return { success: true, settings };
    } else {
      console.error('❌ Failed to fetch auth settings');
      return { success: false, error: 'Failed to fetch settings' };
    }
  } catch (error) {
    console.error('❌ Error checking auth providers:', error);
    return { success: false, error };
  }
};

export default debugAuth;
