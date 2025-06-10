'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Database, Copy, Check } from 'lucide-react';

interface SqlTooltipProps {
  page: string;
  queries: {
    title: string;
    description: string;
    sql: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'POLICY';
  }[];
}

export default function SqlTooltip({ page, queries }: SqlTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      SELECT: 'bg-blue-100 text-blue-800',
      INSERT: 'bg-green-100 text-green-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      POLICY: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs">
          <Database className="w-3 h-3" />
          SQL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            SQL Queries - {page}
          </DialogTitle>
          <DialogDescription>
            Database operations and queries used in this page
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {queries.map((query, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {query.title}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(query.type)}`}>
                      {query.type}
                    </span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(query.sql, index)}
                    className="gap-2"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{query.description}</p>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{query.sql}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
          
          {queries.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No SQL queries defined for this page</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
