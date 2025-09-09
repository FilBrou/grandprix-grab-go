-- Supprimer tous les produits existants
DELETE FROM items;

-- Ajouter les nouveaux produits organisés par catégories

-- Boissons énergisantes
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Monster', 'Boisson énergisante Monster Energy', 4.50, 'energy_drinks', 50, true);

-- Boissons gazeuses non-alcoolisées
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Eau Dasani', 'Eau purifiée Dasani', 2.00, 'soft_drinks', 100, true),
('Coca-Cola', 'Coca-Cola classique', 3.00, 'soft_drinks', 80, true),
('Coca-Cola Zéro', 'Coca-Cola sans sucre', 3.00, 'soft_drinks', 80, true),
('Sprite', 'Boisson gazeuse citron-lime', 3.00, 'soft_drinks', 70, true),
('Coke', 'Coca-Cola format standard', 3.00, 'soft_drinks', 80, true),
('Coke zéro', 'Coca-Cola zéro format standard', 3.00, 'soft_drinks', 80, true),
('Gingerale', 'Boisson gazeuse gingembre', 2.75, 'soft_drinks', 60, true),
('Tonic', 'Eau tonique', 2.75, 'soft_drinks', 40, true),
('Soda', 'Soda classique', 2.50, 'soft_drinks', 50, true);

-- Jus et thés glacés
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Minute Maid - Jus pomme', 'Jus de pomme Minute Maid', 3.25, 'juices', 60, true),
('Fuze - Thé glacé citron', 'Thé glacé saveur citron', 3.50, 'juices', 50, true),
('Jus Canneberge', 'Jus de canneberge', 3.75, 'juices', 45, true);

-- Boissons sportives
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Powerade - Bleu', 'Boisson sportive Powerade bleue', 3.25, 'sports_drinks', 60, true);

-- Bières
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Heineken', 'Bière Heineken premium', 6.50, 'beer', 100, true),
('Heineken (fût)', 'Bière Heineken pression', 7.00, 'beer', 80, true),
('Heineken 0%', 'Bière Heineken sans alcool', 5.50, 'beer', 60, true),
('Sol Cerveza', 'Bière mexicaine Sol', 5.75, 'beer', 50, true),
('VIZZY MAX DRAGON FRUIT MANGO', 'Seltzer dur saveur fruit du dragon mangue', 6.25, 'beer', 40, true),
('Heineken Silver', 'Bière Heineken Silver légère', 6.25, 'beer', 70, true),
('Heineken (gratuité)', 'Bière Heineken offerte', 0.00, 'beer', 20, true),
('Heineken 0% (gratuité)', 'Bière Heineken 0% offerte', 0.00, 'beer', 15, true);

-- Vins
INSERT INTO items (name, description, price, category, stock, available) VALUES
('Rioja Vega', 'Vin rouge espagnol Rioja Vega', 45.00, 'wine', 25, true),
('Grande Réserve des Challières Bonpas Luberon', 'Vin rouge français du Luberon', 38.00, 'wine', 20, true),
('Conde Valdemar Rioja', 'Vin rouge Rioja Conde Valdemar', 42.00, 'wine', 30, true),
('Conde Valdemar Rioja Gran Reserva', 'Vin rouge Rioja Gran Reserva', 65.00, 'wine', 15, true),
('Clarendelle Inspiré par Haut Brion', 'Vin rouge premium Bordeaux', 85.00, 'wine', 12, true),
('Santa Margherita Valdobbiadene Prosecco Superiore', 'Prosecco italien premium', 55.00, 'wine', 20, true),
('Weszeli Mystique', 'Vin premium Weszeli Mystique', 48.00, 'wine', 18, true),
('Weszeli Felix', 'Vin premium Weszeli Felix', 52.00, 'wine', 16, true),
('Hubert Brochard', 'Vin français Hubert Brochard', 44.00, 'wine', 22, true);

-- Spiritueux et cocktails
INSERT INTO items (name, description, price, category, stock, available) VALUES
('L''Assemblée Épicé', 'Spiritueux épicé L''Assemblée', 65.00, 'spirits', 15, true),
('Sortilège Rye', 'Whisky canadien Sortilège Rye', 58.00, 'spirits', 18, true),
('Kamouraska', 'Spiritueux québécois Kamouraska', 62.00, 'spirits', 12, true),
('Portage Gin', 'Gin artisanal Portage', 68.00, 'spirits', 15, true),
('Cuervo Especial Dorée', 'Tequila José Cuervo Especial', 55.00, 'spirits', 20, true),
('BleuRoyal Gin', 'Gin premium BleuRoyal', 72.00, 'spirits', 10, true),
('Disaronno Sour (4 x 355 ml)', 'Cocktail prêt-à-boire Disaronno Sour', 24.00, 'cocktails', 25, true),
('Seventh Heaven Pêche (4 x 355 ml)', 'Cocktail prêt-à-boire pêche', 22.00, 'cocktails', 30, true),
('Fireball Pomme Cannelle (4 x 355 ml)', 'Cocktail prêt-à-boire Fireball', 26.00, 'cocktails', 28, true),
('COCKTAIL CGV', 'Cocktail signature Circuit Gilles-Villeneuve', 12.00, 'cocktails', 40, true),
('MOCKTAIL CGV', 'Cocktail sans alcool signature CGV', 8.00, 'cocktails', 35, true);