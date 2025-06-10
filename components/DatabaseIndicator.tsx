'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, ArrowRight, Table } from 'lucide-react';

interface DatabaseIndicatorProps {
  primaryTables: string[];
  relatedTables?: string[];
  operations: string[];
  description: string;
}

export default function DatabaseIndicator({ 
  primaryTables, 
  relatedTables = [], 
  operations, 
  description 
}: DatabaseIndicatorProps) {
  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Database className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-sm font-semibold text-blue-900">Database Integration</h3>
              <Badge variant="outline" className="text-xs">Supabase PostgreSQL</Badge>
            </div>
            
            <p className="text-sm text-blue-800 mb-3">{description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Tables */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <Table className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Primary Tables:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {primaryTables.map((table) => (
                    <Badge key={table} variant="default" className="text-xs bg-blue-600">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Related Tables */}
              {relatedTables.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1 mb-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Related Tables:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relatedTables.map((table) => (
                      <Badge key={table} variant="outline" className="text-xs border-blue-300 text-blue-700">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operations */}
            <div className="mt-3">
              <span className="text-xs font-medium text-blue-900">Operations: </span>
              <span className="text-xs text-blue-700">
                {operations.join(' • ')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
