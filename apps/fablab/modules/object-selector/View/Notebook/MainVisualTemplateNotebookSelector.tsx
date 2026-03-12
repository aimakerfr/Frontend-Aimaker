import React from 'react';
import GenericObjectSelector from './GenericObjectSelector.tsx';
import type { ObjectItem } from '../../services/api_handler.ts';

type MainVisualTemplateNotebookSelector = {
  onObjectSelectionCallback: (object: ObjectItem) => void;
  currentSelection?: {
    id: string | number;
    name?: string;
  };
};

export const MainVisualTemplateNotebookSelector: React.FC<MainVisualTemplateNotebookSelector> = ({
  onObjectSelectionCallback,
  currentSelection,
}) => {
  return (
    <GenericObjectSelector
      type="CONFIG"
      product_type_for_assembly="notebook"
      module_name_for_assembly="main_visual_template"
      onObjectSelectionCallback={onObjectSelectionCallback}
      currentSelection={currentSelection}
    />
  );
};
