/**
 * Migrated Button Components - Uses Enhanced System
 * This replaces old button imports throughout the app
 */

// Re-export enhanced components as standard names for easy migration
export {
  Button,
  ButtonGroup,
  buttonVariants,
} from "./enhanced-button";

// Export enhanced variants for new components  
export {
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  TextButton,
  DestructiveButton,
  LoadingButton,
} from "./enhanced-button";