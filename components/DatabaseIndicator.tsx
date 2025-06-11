'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, ChevronDown, ChevronUp, Table, ArrowRight, Info } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200 shadow-sm">
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Database Integration</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200">
              {primaryTables.join(', ')}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border-slate-200">
              PostgreSQL
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-start space-x-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary Tables */}
              <div>
                <div className="flex items-center space-x-1 mb-1.5">
                  <Table className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">Primary:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {primaryTables.map((table) => (
                    <Badge key={table} className="text-xs px-2 py-0.5 bg-blue-600 text-white">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Related Tables */}
              {relatedTables.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1 mb-1.5">
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">Related:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relatedTables.map((table) => (
                      <Badge key={table} variant="outline" className="text-xs px-2 py-0.5 border-slate-300 text-slate-600">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operations */}
            <div className="mt-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-700">Operations: </span>
              <span className="text-xs text-slate-600">
                {operations.join(' • ')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
