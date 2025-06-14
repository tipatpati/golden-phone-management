
export type RepairFormData = {
  client_id: string;
  technician_id: string;
  device: string;
  imei: string;
  issue: string;
  status: 'quoted' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_completion_date: string;
  cost: number;
  notes: string;
};
