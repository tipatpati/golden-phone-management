// Employee utility functions - no concatenation, individual fields only
export interface EmployeeDisplayData {
  displayName: string;
  initials: string;
  searchTerms: string[];
}

/**
 * Get display name for an employee without concatenation
 */
export function getEmployeeDisplayName(employee: {
  first_name: string;
  last_name: string;
}): string {
  const firstName = employee.first_name?.trim() || '';
  const lastName = employee.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  
  return 'Unnamed Employee';
}

/**
 * Get initials from individual name fields
 */
export function getEmployeeInitials(employee: {
  first_name: string;
  last_name: string;
}): string {
  const firstName = employee.first_name?.trim() || '';
  const lastName = employee.last_name?.trim() || '';
  
  let initials = '';
  if (firstName) initials += firstName.charAt(0);
  if (lastName) initials += lastName.charAt(0);
  
  return initials.toUpperCase() || 'UE';
}

/**
 * Format employee search terms - individual fields only
 */
export function getEmployeeSearchTerms(employee: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
}): string[] {
  const terms: string[] = [];
  
  if (employee.first_name) terms.push(employee.first_name);
  if (employee.last_name) terms.push(employee.last_name);
  if (employee.email) terms.push(employee.email);
  if (employee.phone) terms.push(employee.phone);
  if (employee.position) terms.push(employee.position);
  if (employee.department) terms.push(employee.department);
  
  return terms.filter(term => term.trim().length > 0);
}