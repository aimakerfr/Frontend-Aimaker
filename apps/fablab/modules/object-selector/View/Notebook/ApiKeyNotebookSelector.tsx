import React from 'react';
import GenericObjectSelector from './GenericObjectSelector.tsx';
import type { ObjectItem } from '../../services/api_handler.ts';

type ApiKeyNotebookSelector = {
  onObjectSelectionCallback: (object: ObjectItem) => void;
  currentSelection?: {
    id: string | number;
    name?: string;
  };
};

export const ApiKeyNotebookSelector: React.FC<ApiKeyNotebookSelector> = ({
  onObjectSelectionCallback,
  currentSelection,
}) => {
  return (
    <GenericObjectSelector
      type="CONFIG"
      product_type_for_assembly="notebook"
      module_name_for_assembly="api_key"
      onObjectSelectionCallback={onObjectSelectionCallback}
      currentSelection={currentSelection}
    />
  );
};
