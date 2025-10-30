-- Phase 1: Correction de sécurité CRITIQUE - Séparer les rôles de la table profiles

-- Créer le type enum pour les rôles
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Créer la table user_roles sécurisée
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Activer RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Créer une fonction SECURITY DEFINER pour vérifier les rôles sans récursion RLS
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = check_role
  );
$$;

-- Migrer les données existantes de profiles.role vers user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Supprimer la colonne role de profiles (pas sécurisée)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Mettre à jour toutes les RLS policies pour utiliser has_role() au lieu de is_admin()

-- Events policies
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Items policies
DROP POLICY IF EXISTS "Admins can manage items" ON public.items;
CREATE POLICY "Admins can manage items"
ON public.items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all items" ON public.items;
CREATE POLICY "Admins can view all items"
ON public.items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Monday config policies
DROP POLICY IF EXISTS "Admins can delete monday config" ON public.monday_config;
CREATE POLICY "Admins can delete monday config"
ON public.monday_config
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert monday config" ON public.monday_config;
CREATE POLICY "Admins can insert monday config"
ON public.monday_config
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update monday config" ON public.monday_config;
CREATE POLICY "Admins can update monday config"
ON public.monday_config
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view monday config" ON public.monday_config;
CREATE POLICY "Admins can view monday config"
ON public.monday_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Notifications policies
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Order items policies
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Orders policies
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User locations policies
DROP POLICY IF EXISTS "Admins can delete locations" ON public.user_locations;
CREATE POLICY "Admins can delete locations"
ON public.user_locations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert locations" ON public.user_locations;
CREATE POLICY "Admins can insert locations"
ON public.user_locations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update locations" ON public.user_locations;
CREATE POLICY "Admins can update locations"
ON public.user_locations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all locations" ON public.user_locations;
CREATE POLICY "Admins can view all locations"
ON public.user_locations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view locations for active events" ON public.user_locations;
CREATE POLICY "Users can view locations for active events"
ON public.user_locations
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) 
  AND event_id IN (
    SELECT id FROM public.events 
    WHERE status IN ('active', 'completed')
  )
);

-- RLS policies pour user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Créer un index pour améliorer les performances
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Phase 2-4: Création des tables de retours et fonctions RPC

-- Table product_returns
CREATE TABLE public.product_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_location_id UUID REFERENCES public.user_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validation_date TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;

-- Table product_return_items
CREATE TABLE public.product_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.product_returns(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  declared_quantity INTEGER NOT NULL CHECK (declared_quantity > 0),
  validated_quantity INTEGER CHECK (validated_quantity >= 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_return_items ENABLE ROW LEVEL SECURITY;

-- Index pour performance
CREATE INDEX idx_product_returns_user_id ON public.product_returns(user_id);
CREATE INDEX idx_product_returns_event_id ON public.product_returns(event_id);
CREATE INDEX idx_product_returns_status ON public.product_returns(status);
CREATE INDEX idx_product_return_items_return_id ON public.product_return_items(return_id);

-- Trigger pour updated_at
CREATE TRIGGER update_product_returns_updated_at
  BEFORE UPDATE ON public.product_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies pour product_returns
CREATE POLICY "Users can create returns for active event"
ON public.product_returns
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND event_id IN (SELECT id FROM public.events WHERE status = 'active')
);

CREATE POLICY "Users can view their own returns"
ON public.product_returns
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their pending returns"
ON public.product_returns
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (status = 'pending');

CREATE POLICY "Admins can manage all returns"
ON public.product_returns
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies pour product_return_items
CREATE POLICY "Users can create items for their returns"
ON public.product_return_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_returns 
    WHERE id = return_id 
    AND user_id = auth.uid()
    AND status = 'pending'
  )
);

CREATE POLICY "Users can view their return items"
ON public.product_return_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_returns 
    WHERE id = return_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all return items"
ON public.product_return_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fonction RPC pour calculer le total des retours validés
CREATE OR REPLACE FUNCTION public.calculate_user_returns_total(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    SUM(pri.validated_quantity * pri.unit_price), 
    0
  )::NUMERIC(10,2)
  FROM product_returns pr
  JOIN product_return_items pri ON pr.id = pri.return_id
  WHERE pr.user_id = p_user_id
    AND pr.event_id = p_event_id
    AND pr.status = 'validated';
$$;