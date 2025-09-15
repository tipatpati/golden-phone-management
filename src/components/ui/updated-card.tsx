/**
 * Migrated Card Components - Uses Enhanced System  
 * This replaces old card imports throughout the app
 */

// Re-export enhanced components as standard names for easy migration
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle, 
  CardDescription,
  CardContent,
} from "./enhanced-card";

// Export enhanced variants for new components
export {
  DataCard,
  StatsCard,
  InteractiveCard,
} from "./enhanced-card";