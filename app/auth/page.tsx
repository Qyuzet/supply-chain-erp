'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chrome, Database, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Supply Chain ERP</h1>
              <p className="text-sm text-gray-400">Enterprise Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Sign In Card */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 transition-colors font-medium"
              size="lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
              ) : (
                <Chrome className="mr-3 h-5 w-5" />
              )}
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="text-center text-sm text-gray-400">
              <p>New users are automatically registered</p>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/10">
              <p>Secured with Google OAuth 2.0</p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Home
          </Button>
        </div>

      </div>
    </div>
  );
}