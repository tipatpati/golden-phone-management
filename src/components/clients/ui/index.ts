// Client UI Components Library
// Centralized exports for all client-specific UI components

export { ClientCard } from "./ClientCard";
export { ClientMetrics } from "./ClientMetrics";
export { ClientDetailsView } from "./ClientDetailsView";

// Re-export form components for convenience
export { ClientForm } from "../forms/ClientForm";
export { ClientBusinessInfo } from "../forms/ClientBusinessInfo";
export { ClientContactInfo } from "../forms/ClientContactInfo";

// Re-export types
export type { ClientFormData, ClientFormValidationError } from "../forms/types";

// Re-export hooks
export { useClientForm } from "../forms/hooks/useClientForm";
export { useClientValidation } from "../forms/hooks/useClientValidation";
export { useClientServices } from "../forms/hooks/useClientServices";