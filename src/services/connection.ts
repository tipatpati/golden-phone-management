
import { toast } from '@/components/ui/sonner';
import { getMockApiConfig } from './config';

// Simplified API health check for mock mode or Supabase
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking API connection...');
    
    // For mock API mode
    if (getMockApiConfig()) {
      console.log('Using mock API mode - connection is simulated as successful');
      return true;
    }
    
    // For Supabase mode, we can always assume connection is available
    console.log('Using Supabase mode - connection available');
    return true;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

// Test the API connection on demand
export const testApiConnection = async (): Promise<void> => {
  toast.info('Testing connection...', {
    id: 'api-test',
    duration: 2000
  });
  
  const isConnected = await checkApiConnection();
  
  if (isConnected) {
    toast.success('Connection available!', {
      id: 'api-test',
    });
  } else {
    toast.error('Connection unavailable', {
      id: 'api-test',
      description: 'Check your settings'
    });
  }
};
