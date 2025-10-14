-- Delete all items without images (keeping only items with image_url)
DELETE FROM public.items 
WHERE image_url IS NULL;