
import { supabase } from "@/integrations/supabase/client";
import { withStoreId } from './stores/storeHelpers';

export type Client = {
  id: string;
  type: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
};

export type CreateClientData = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export const supabaseClientApi = {
  async getClients(searchTerm: string = '') {
    console.log('Fetching clients from Supabase...');
    
    let query = supabase
      .from('clients')
      .select('*');
    
    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    console.log('Clients fetched successfully:', data);
    return data || [];
  },

  async getClient(id: string) {
    console.log('Fetching client:', id);
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Client not found');
    }
    
    return data;
  },

  async createClient(clientData: CreateClientData) {
    console.log('Creating client:', clientData);
    
    const clientWithStore = await withStoreId(clientData);
    const { data, error } = await supabase
      .from('clients')
      .insert([clientWithStore])
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    console.log('Client created successfully:', data);
    return data;
  },

  async updateClient(id: string, clientData: Partial<CreateClientData>) {
    console.log('Updating client:', id, clientData);
    
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
    
    console.log('Client updated successfully:', data);
    return data;
  },

  async deleteClient(id: string) {
    console.log('Deleting client:', id);
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
    
    console.log('Client deleted successfully');
    return true;
  }
};
