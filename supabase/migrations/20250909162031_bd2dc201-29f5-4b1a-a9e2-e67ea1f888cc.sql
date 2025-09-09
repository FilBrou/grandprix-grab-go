-- Add type column to collection_points table
ALTER TABLE public.collection_points 
ADD COLUMN type text NOT NULL DEFAULT 'point_de_livraison';

-- Add check constraint for valid types
ALTER TABLE public.collection_points 
ADD CONSTRAINT collection_points_type_check 
CHECK (type IN ('entrepot', 'sous_entrepot', 'point_de_livraison'));

-- Update existing records to have a default type
UPDATE public.collection_points 
SET type = 'point_de_livraison' 
WHERE type IS NULL;

-- Insert some sample collection points for testing
INSERT INTO public.collection_points (name, location, latitude, longitude, type) VALUES
('Entrepôt Principal Montréal', '1000 Rue Notre-Dame Est, Montréal, QC', 45.5017, -73.5673, 'entrepot'),
('Sous-entrepôt Plateau', '500 Rue Saint-Denis, Montréal, QC', 45.5200, -73.5673, 'sous_entrepot'),
('Point Circuit Gilles-Villeneuve', 'Circuit Gilles-Villeneuve, Montréal, QC', 45.5048, -73.5265, 'point_de_livraison'),
('Point Métro Berri-UQAM', '1050 Rue Berri, Montréal, QC', 45.5154, -73.5635, 'point_de_livraison'),
('Point Vieux-Port', '333 Rue de la Commune O, Montréal, QC', 45.5016, -73.5570, 'point_de_livraison');