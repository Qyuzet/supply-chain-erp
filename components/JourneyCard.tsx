'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Info,
  X
} from 'lucide-react';

interface JourneyStep {
  step: string;
  description: string;
  status?: 'active' | 'completed' | 'pending';
}

interface JourneyCardProps {
  title: string;
  description: string;
  steps: JourneyStep[];
  currentStep?: number;
  compact?: boolean;
  defaultVisible?: boolean;
}

export default function JourneyCard({
  title,
  description,
  steps,
  currentStep = 0,
  compact = true,
  defaultVisible = false
}: JourneyCardProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) {
    return (
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="text-xs h-7 px-3 bg-muted/50 hover:bg-muted border-border"
        >
          <Info className="h-3 w-3 mr-1" />
          Show Journey
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-muted/50 to-muted/30 border-border shadow-sm">
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-1 rounded">
              <ArrowRight className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">{title}</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              Step {currentStep + 1}/{steps.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {compact && (
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
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="mt-2 mb-2">
          <div className="flex items-center space-x-1">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      index < currentStep
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Info */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{steps[currentStep]?.step}</span>
          {!isExpanded && (
            <span className="ml-2">
              {steps[currentStep]?.description}
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">{description}</p>
            
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-2 p-2 rounded ${
                    index === currentStep
                      ? 'bg-primary/10 border border-primary/20'
                      : index < currentStep
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-muted border border-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < currentStep
                        ? 'bg-emerald-600 text-white'
                        : index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground text-background'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-medium text-foreground">{step.step}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
