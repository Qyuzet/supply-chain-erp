'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Info,
  Lightbulb,
  Target,
  ArrowRight
} from 'lucide-react';

interface ExplanationStep {
  title: string;
  description: string;
  action?: string;
  icon?: React.ComponentType<any>;
}

interface PageExplanationProps {
  title: string;
  description: string;
  steps: ExplanationStep[];
  tips?: string[];
  relatedPages?: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  defaultVisible?: boolean;
}

export default function PageExplanation({
  title,
  description,
  steps,
  tips = [],
  relatedPages = [],
  defaultVisible = false
}: PageExplanationProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Page Help
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Info className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">{title}</CardTitle>
              <CardDescription className="text-blue-700">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Steps */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                How to use this page:
              </h4>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">{step.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.action && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {step.action}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Pro Tips:
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <ul className="space-y-2">
                    {tips.map((tip, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Related Pages */}
            {relatedPages.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Related Pages:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {relatedPages.map((page, index) => (
                    <div key={index} className="bg-white border border-blue-100 rounded-lg p-3 hover:bg-blue-50 transition-colors">
                      <h5 className="font-medium text-gray-900 text-sm">{page.name}</h5>
                      <p className="text-xs text-gray-600 mt-1">{page.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
