-- Enable real-time updates for barcode_registry table
-- Set replica identity to FULL to capture complete row data during updates
ALTER TABLE barcode_registry REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE barcode_registry;

-- Add comment explaining the real-time configuration
COMMENT ON TABLE barcode_registry IS 
'Barcode registry with real-time updates enabled. Tracks all barcode assignments and changes across the system.';