-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'viewer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  tariff DECIMAL(10,4) NOT NULL DEFAULT 0.75,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_access table (for sharing with other users)
CREATE TABLE public.property_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);

-- Create stays table
CREATE TABLE public.stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  -- Entry readings
  monitoring_entry DECIMAL(12,2),
  codigo_03_entry DECIMAL(12,2),
  codigo_103_entry DECIMAL(12,2),
  -- Exit readings
  monitoring_exit DECIMAL(12,2),
  codigo_03_exit DECIMAL(12,2),
  codigo_103_exit DECIMAL(12,2),
  -- Calculated values
  grid_consumption DECIMAL(12,2),
  grid_injection DECIMAL(12,2),
  solar_generation DECIMAL(12,2),
  self_consumption DECIMAL(12,2),
  total_consumption DECIMAL(12,2),
  amount_to_charge DECIMAL(12,2),
  tariff_used DECIMAL(10,4),
  -- Payment
  is_paid BOOLEAN DEFAULT false,
  payment_proof_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;

-- Security definer function to check property access
CREATE OR REPLACE FUNCTION public.has_property_access(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties WHERE id = _property_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.property_access WHERE property_id = _property_id AND user_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can view properties shared with them"
ON public.properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_access 
    WHERE property_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (owner_id = auth.uid());

-- Property access policies
CREATE POLICY "Property owners can view access"
ON public.property_access FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can grant access"
ON public.property_access FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can revoke access"
ON public.property_access FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

-- Stays policies
CREATE POLICY "Users can view stays of accessible properties"
ON public.stays FOR SELECT
USING (public.has_property_access(auth.uid(), property_id));

CREATE POLICY "Users can insert stays on owned properties"
ON public.stays FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update stays on owned properties"
ON public.stays FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete stays on owned properties"
ON public.stays FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stays_updated_at
BEFORE UPDATE ON public.stays
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies for payment proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view payment proofs of their properties"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
);