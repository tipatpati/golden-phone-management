// Client utility functions - no concatenation, individual fields only
export interface ClientDisplayData {
  displayName: string;
  type: 'business' | 'individual';
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

/**
 * Get display name for a client without concatenation
 */
export function getClientDisplayName(client: {
  type: 'business' | 'individual';
  first_name?: string;
  last_name?: string;
  company_name?: string;
}): string {
  if (client.type === 'business') {
    return client.company_name || 'Unnamed Business';
  }
  
  // For individual clients, return structured display
  const firstName = client.first_name?.trim() || '';
  const lastName = client.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  
  return 'Unnamed Client';
}

/**
 * Get initials from individual name fields
 */
export function getClientInitials(client: {
  type: 'business' | 'individual';
  first_name?: string;
  last_name?: string;
  company_name?: string;
}): string {
  if (client.type === 'business') {
    const companyName = client.company_name || 'UB';
    return companyName.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  const firstName = client.first_name?.trim() || '';
  const lastName = client.last_name?.trim() || '';
  
  let initials = '';
  if (firstName) initials += firstName.charAt(0);
  if (lastName) initials += lastName.charAt(0);
  
  return initials.toUpperCase() || 'UC';
}

/**
 * Format client search terms - individual fields only
 */
export function getClientSearchTerms(client: {
  type: 'business' | 'individual';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
}): string[] {
  const terms: string[] = [];
  
  if (client.type === 'business' && client.company_name) {
    terms.push(client.company_name);
  }
  
  if (client.first_name) terms.push(client.first_name);
  if (client.last_name) terms.push(client.last_name);
  if (client.email) terms.push(client.email);
  if (client.phone) terms.push(client.phone);
  
  return terms.filter(term => term.trim().length > 0);
}