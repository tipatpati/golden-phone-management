/**
 * Centralized UI Component Exports
 * Single source for all enhanced UI components
 */

// Enhanced Dialog System
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
  SmallDialog,
  MediumDialog,
  LargeDialog,
} from "./enhanced-dialog";

// Enhanced Card System
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  DataCard,
  InteractiveCard,
} from "./enhanced-card";

// Enhanced Button System
export {
  Button,
  ButtonGroup,
  buttonVariants,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  TextButton,
  DestructiveButton,
  LoadingButton,
} from "./enhanced-button";

// Status and Loading Components
export {
  StatusIndicator,
  StatusIcon,
  ServiceStatus,
  DataIntegrityStatus,
  ClientTypeBadge,
} from "./status-indicators";

export {
  LoadingSpinner,
  LoadingState,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
} from "./loading-states";

export { EmptyState } from "./empty-state";

// Standardized Components
export { SearchBar } from "./search-bar";
export { StatsCard } from "./stats-card";
export { StatsCard as EnhancedStatsCard } from "./enhanced-card";

// Design System Utilities
export {
  Container,
  SectionSpace,
  DESIGN_TOKENS,
  DIALOG_SIZES,
  SPACING,
  PADDING,
  containerVariants,
  cardSpacingVariants,
  gridVariants,
  responsiveDialogVariants,
  typographyVariants,
  buttonGroupVariants,
} from "./design-system";

// Layout Components
export { PageLayout } from "@/components/common/PageLayout";
export { PageHeader } from "@/components/common/PageHeader";