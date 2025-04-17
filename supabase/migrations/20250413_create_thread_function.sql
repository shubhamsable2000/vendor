
-- Create a function to create threads with type
CREATE OR REPLACE FUNCTION public.create_negotiation_thread(
  thread_id integer,
  rfx_id integer,
  vendor_name text,
  subject text,
  status text,
  unread boolean
)
RETURNS SETOF public.email_threads
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.email_threads 
    (id, rfx_id, vendor_name, subject, status, unread, type)
  VALUES
    (thread_id, rfx_id, vendor_name, subject, status, unread, 'negotiation')
  RETURNING *;
END;
$$;
