

## Reconfiguration Monday.com - Nouveau Board

### Etape 1 - Mettre a jour le secret MONDAY_API_TOKEN
Remplacer la valeur actuelle du secret `MONDAY_API_TOKEN` par la nouvelle cle API fournie.

### Etape 2 - Lire la structure du nouveau board
Appeler l'edge function `monday-integration` avec l'action `getBoardColumns` et le board ID `18396307106` pour decouvrir toutes les colonnes disponibles (ID, titre, type).

### Etape 3 - Adapter le mapping des colonnes
Mettre a jour la logique de mapping dans `supabase/functions/sync-order-by-id/index.ts` pour correspondre aux noms et types des colonnes du nouveau board. Le code actuel fait un mapping dynamique base sur les titres de colonnes (recherche de mots-cles comme "client", "statut", "montant", etc.), donc il pourrait fonctionner tel quel si les colonnes du nouveau board suivent des conventions similaires. Sinon, on ajustera les mots-cles de detection.

### Etape 4 - Mettre a jour la config en base de donnees
Mettre a jour la table `monday_config` avec le nouveau `board_id` (`18396307106`) et le `board_name` correspondant.

### Etape 5 - Redeployer et tester
- Redeployer les edge functions `sync-order-by-id` et `monday-integration`
- Tester la connexion en lisant les colonnes du board
- Valider avec un test de creation d'item

### Details techniques
Le fichier `supabase/functions/sync-order-by-id/index.ts` sera potentiellement modifie pour ajuster le mapping des colonnes selon la structure reelle du nouveau board (decouverte a l'etape 2). Les modifications dependront des resultats de la lecture du board.

