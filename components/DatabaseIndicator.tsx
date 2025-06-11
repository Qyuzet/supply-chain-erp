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
    <Card className="mb-4 bg-gradient-to-r from-muted/50 to-muted/30 border-border shadow-sm">
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Database Integration</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              {primaryTables.join(', ')}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border-border">
              PostgreSQL
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start space-x-2 mb-3">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary Tables */}
              <div>
                <div className="flex items-center space-x-1 mb-1.5">
                  <Table className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">Primary:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {primaryTables.map((table) => (
                    <Badge key={table} className="text-xs px-2 py-0.5 bg-primary text-primary-foreground">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Related Tables */}
              {relatedTables.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1 mb-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Related:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relatedTables.map((table) => (
                      <Badge key={table} variant="outline" className="text-xs px-2 py-0.5 border-border text-muted-foreground">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Operations */}
            <div className="mt-3 pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-foreground">Operations: </span>
              <span className="text-xs text-muted-foreground">
                {operations.join(' • ')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
