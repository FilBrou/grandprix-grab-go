import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  itemCounts: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  itemCounts
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategoryChange(category)}
          className="flex items-center space-x-2"
        >
          <span>{t(`category.${category}`)}</span>
          <Badge variant="secondary" className="ml-2">
            {itemCounts[category] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;