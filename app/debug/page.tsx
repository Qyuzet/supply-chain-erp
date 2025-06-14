'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugAuth, clearAuthState, testGoogleAuth, checkAuthProviders } from '@/debug-auth';

export default function DebugPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const result = await debugAuth();
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error });
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    setLoading(true);
    try {
      await clearAuthState();
      setResults({ message: 'Auth state cleared' });
    } catch (error) {
      setResults({ success: false, error: error });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      const result = await testGoogleAuth();
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error });
    } finally {
      setLoading(false);
    }
  };

  const checkProviders = async () => {
    setLoading(true);
    try {
      const result = await checkAuthProviders();
      setResults(result);
    } catch (error) {
      setResults({ success: false, error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Auth Debug Page</h1>
        
        <div className="grid gap-4 mb-8">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Running...' : 'Run Auth Debug'}
          </Button>
          
          <Button onClick={clearAuth} disabled={loading} variant="outline">
            Clear Auth State
          </Button>
          
          <Button onClick={checkProviders} disabled={loading} variant="outline">
            Check Auth Providers
          </Button>

          <Button onClick={testAuth} disabled={loading} variant="outline">
            Test Google Auth
          </Button>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Run Auth Debug</h3>
              <p className="text-sm text-muted-foreground">
                Check Supabase connection, session status, and database access
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">2. Clear Auth State</h3>
              <p className="text-sm text-muted-foreground">
                Clear all authentication data and start fresh
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">3. Test Google Auth</h3>
              <p className="text-sm text-muted-foreground">
                Test Google OAuth login flow
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
