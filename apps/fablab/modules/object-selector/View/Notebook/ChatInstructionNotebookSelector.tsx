import React from 'react';
import GenericObjectSelector from './GenericObjectSelector.tsx';
import type { ObjectItem } from '../../services/api_handler.ts';

type ChatInstructionNotebookSelectorProps = {
  onObjectSelectionCallback: (object: ObjectItem) => void;
  currentSelection?: {
    id: string | number;
    name?: string;
  };
};

const ChatInstructionNotebookSelector: React.FC<ChatInstructionNotebookSelectorProps> = ({
  onObjectSelectionCallback,
  currentSelection,
}) => {
  return (
    <GenericObjectSelector
      type="CONFIG"
      product_type_for_assembly="notebook"
      module_name_for_assembly="chat_instruction"
      onObjectSelectionCallback={onObjectSelectionCallback}
      currentSelection={currentSelection}
    />
  );
};

export default ChatInstructionNotebookSelector;