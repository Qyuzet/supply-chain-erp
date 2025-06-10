'use client';

export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</h2>
          <p className="text-sm text-gray-600">
            {supabaseUrl ? `✅ Set: ${supabaseUrl}` : '❌ Missing'}
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</h2>
          <p className="text-sm text-gray-600">
            {supabaseAnonKey ? `✅ Set: ${supabaseAnonKey.slice(0, 20)}...` : '❌ Missing'}
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Browser Environment:</h2>
          <p className="text-sm text-gray-600">
            {typeof window !== 'undefined' ? '✅ Client-side' : '⚠️ Server-side'}
          </p>
        </div>
      </div>
    </div>
  );
}
