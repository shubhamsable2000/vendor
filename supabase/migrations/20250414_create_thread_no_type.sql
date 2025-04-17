
-- Create a function to create threads without requiring the type column
-- This works as a fallback when the schema cache is out of sync
CREATE OR REPLACE FUNCTION public.create_thread_no_type(
  thread_id integer,
  rfx_id_val integer,
  vendor_name_val text,
  subject_val text,
  status_val text,
  unread_val boolean
)
RETURNS SETOF public.email_threads
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.email_threads 
    (id, rfx_id, vendor_name, subject, status, unread)
  VALUES
    (thread_id, rfx_id_val, vendor_name_val, subject_val, status_val, unread_val)
  RETURNING *;
END;
$$;
