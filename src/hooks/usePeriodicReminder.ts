import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PeriodicReminderConfig {
  intervalMinutes?: number;
  message?: string;
  title?: string;
  enabled?: boolean;
}

export function usePeriodicReminder(config: PeriodicReminderConfig = {}) {
  const {
    intervalMinutes = 60,
    message = "Remember to save your work and take a break!",
    title = "Periodic Reminder",
    enabled = true
  } = config;

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    // Set up the reminder interval
    intervalRef.current = setInterval(() => {
      toast({
        title,
        description: message,
        duration: 5000,
      });
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMinutes, message, title, enabled, toast]);

  // Function to manually reset the timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        toast({
          title,
          description: message,
          duration: 5000,
        });
      }, intervalMinutes * 60 * 1000);
    }
  };

  // Function to get time until next reminder
  const getTimeUntilNext = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const intervalMs = intervalMinutes * 60 * 1000;
    const remaining = intervalMs - (elapsed % intervalMs);
    return Math.floor(remaining / 1000 / 60); // Return minutes
  };

  return {
    resetTimer,
    getTimeUntilNext
  };
}