

## Ajout de sous-éléments Monday.com par article commandé

### Objectif
Actuellement, lors de la synchronisation d'une commande vers Monday.com, tous les articles sont concaténés dans une seule colonne texte (ex: "2x Coca-Cola, 1x Sprite"). L'objectif est de créer un **sous-élément (subitem)** pour chaque article de la commande, avec ses détails (nom, quantité, prix unitaire).

### Fonctionnement actuel
1. Une commande est créée dans Supabase
2. Un trigger appelle `sync-order-by-id`
3. Un seul élément est créé dans Monday avec les articles en texte concaténé

### Nouveau fonctionnement
1. L'élément parent (la commande) est créé comme avant
2. Pour chaque `order_item`, un **sous-élément** est créé avec :
   - **Nom** : nom du produit (ex: "Coca-Cola")
   - **Colonnes** : quantité, prix unitaire, sous-total

### Modifications techniques

**Fichier : `supabase/functions/sync-order-by-id/index.ts`**

1. Ajouter une fonction `createSubitem` utilisant la mutation GraphQL :
```
mutation ($parentItemId: ID!, $itemName: String!, $columnValues: JSON) {
  create_subitem (
    parent_item_id: $parentItemId,
    item_name: $itemName,
    column_values: $columnValues
  ) {
    id
    name
    board { id }
  }
}
```

2. Après la création de l'élément parent, récupérer le `mondayItemId` retourné

3. Boucler sur chaque `order_item` et appeler `createSubitem` avec :
   - `parent_item_id` : l'ID de l'élément parent créé
   - `item_name` : le nom du produit
   - `column_values` : quantité et prix (adaptés aux colonnes du sous-board)

4. Pour les colonnes des sous-éléments, on tentera de mapper automatiquement les colonnes par titre (quantité, prix, sous-total) comme c'est déjà fait pour le board principal

**Fichier : `supabase/functions/monday-integration/index.ts`**

5. Ajouter une action `createSubitem` pour permettre aussi la création manuelle de sous-éléments depuis l'interface admin

### Notes importantes
- Les sous-éléments dans Monday vivent sur un **board caché séparé** - la mutation `create_subitem` gère cela automatiquement
- Le board parent doit avoir une **colonne Subitems** activée (sinon Monday retournera une erreur `NoSubitemsColumnInThisBoard`)
- Les colonnes des sous-éléments peuvent différer de celles du board parent - on récupérera dynamiquement les colonnes du sous-board après la première création
- Si la création d'un sous-élément échoue, la commande parent reste synchronisée (pas de rollback)

