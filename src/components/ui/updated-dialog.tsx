/**
 * Migrated Dialog Components - Uses Enhanced System
 * This replaces old dialog imports throughout the app
 */

// Re-export enhanced components as standard names for easy migration
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  EnhancedDialogContent as DialogContent,
  DialogHeader,
  DialogFooter, 
  DialogTitle,
  DialogDescription,
} from "./enhanced-dialog";

// Export enhanced variants for new components
export {
  SmallDialog,
  MediumDialog, 
  LargeDialog,
} from "./enhanced-dialog";