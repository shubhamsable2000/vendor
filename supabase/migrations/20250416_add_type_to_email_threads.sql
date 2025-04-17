
-- Add type column to email_threads table with default value 'rfx'
ALTER TABLE public.email_threads
ADD COLUMN IF NOT EXISTS type text DEFAULT 'rfx';

-- Update existing threads with type based on their tracking data
UPDATE public.email_threads
SET type = 'negotiation'
FROM public.email_tracking
WHERE email_threads.id = email_tracking.thread_id 
  AND (email_tracking.tracking_id LIKE 'negotiation-%' OR email_tracking.type = 'negotiation');
