import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
    common: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    common: !isCommonPassword(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('Use at least 8 characters');
  if (!requirements.uppercase) feedback.push('Add uppercase letters');
  if (!requirements.lowercase) feedback.push('Add lowercase letters');
  if (!requirements.numbers) feedback.push('Add numbers');
  if (!requirements.special) feedback.push('Add special characters');
  if (!requirements.common) feedback.push('Avoid common passwords');

  return { score, feedback, requirements };
}

function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123',
    'Password1', 'password1', '12345678', 'qwerty123'
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);
  
  const getStrengthLabel = (score: number): string => {
    if (score <= 2) return 'Very Weak';
    if (score <= 3) return 'Weak';
    if (score <= 4) return 'Fair';
    if (score <= 5) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-orange-500';
    if (score <= 4) return 'bg-yellow-500';
    if (score <= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn(
          'text-sm font-medium',
          strength.score <= 2 ? 'text-red-600' :
          strength.score <= 3 ? 'text-orange-600' :
          strength.score <= 4 ? 'text-yellow-600' :
          strength.score <= 5 ? 'text-blue-600' : 'text-green-600'
        )}>
          {getStrengthLabel(strength.score)}
        </span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i < strength.score 
                ? getStrengthColor(strength.score)
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              {item}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 text-xs">
        {Object.entries(strength.requirements).map(([key, met]) => (
          <div key={key} className={cn(
            'flex items-center gap-1',
            met ? 'text-green-600' : 'text-muted-foreground'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              met ? 'bg-green-500' : 'bg-muted'
            )} />
            {getRequirementLabel(key)}
          </div>
        ))}
      </div>
    </div>
  );
}

function getRequirementLabel(key: string): string {
  const labels: Record<string, string> = {
    length: '8+ characters',
    uppercase: 'Uppercase',
    lowercase: 'Lowercase', 
    numbers: 'Numbers',
    special: 'Special chars',
    common: 'Not common'
  };
  return labels[key] || key;
}