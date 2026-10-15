import React from 'react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChanged?: () => void;
  onSelectCategory?: (id: number, name: string) => void;
}

/**
 * @deprecated Modul kategori telah dihapus sesuai permintaan klien (Search-driven UX).
 */
export const CategoryModal: React.FC<CategoryModalProps> = () => {
  return null;
};
