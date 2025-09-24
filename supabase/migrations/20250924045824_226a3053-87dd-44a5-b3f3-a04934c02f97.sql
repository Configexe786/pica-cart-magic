-- Fix security warnings by setting search_path for functions

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Fix the generate_order_id function
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 12-digit ID using timestamp + random
    new_id := LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 10, '0') || 
              LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
    new_id := RIGHT(new_id, 12);
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_id = new_id) INTO exists_check;
    
    -- Exit loop if ID is unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;