-- Mettre à jour le rôle de Felix Brouillette pour le rendre administrateur
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE user_id = '6fc0e533-44db-438b-8911-dd974f9d449c';