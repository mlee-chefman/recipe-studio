import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, TextInputProps, NativeSyntheticEvent, TextInputKeyPressEventData, TextInputSelectionChangeEventData } from 'react-native';

interface MultilineInstructionInputProps extends Omit<TextInputProps, 'onSubmitEditing' | 'returnKeyType' | 'blurOnSubmit'> {
  onAddNewStep?: () => void;
  onFocusNext?: () => void;
  isLastStep?: boolean;
}

export interface MultilineInstructionInputRef {
  focus: () => void;
  blur: () => void;
  isFocused: () => boolean;
}

const MultilineInstructionInput = forwardRef<MultilineInstructionInputRef, MultilineInstructionInputProps>(
  ({ onAddNewStep, onFocusNext, isLastStep = false, value = '', ...props }, ref) => {
    const textInputRef = useRef<TextInput>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    useImperativeHandle(ref, () => ({
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur(),
      isFocused: () => textInputRef.current?.isFocused() || false,
    }));

    const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection);
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter') {
        const trimmedValue = value.trim();

        // Only handle Enter at the end of text for navigation
        // Allow Enter in the middle for multiline editing
        const isAtEnd = selection.start >= (trimmedValue.length > 0 ? trimmedValue.length : 0);

        if (isAtEnd && trimmedValue) {
          if (isLastStep && onAddNewStep) {
            // For last step, add new step
            e.preventDefault();
            onAddNewStep();
            return;
          } else if (!isLastStep && onFocusNext) {
            // For non-last steps, move to next step
            e.preventDefault();
            onFocusNext();
            return;
          }
        }

        // If not at the end or empty, allow normal Enter behavior (new line)
      }
    };

    const handleSubmitEditing = () => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        if (isLastStep && onAddNewStep) {
          onAddNewStep();
        } else if (!isLastStep && onFocusNext) {
          onFocusNext();
        }
      }
    };

    return (
      <TextInput
        ref={textInputRef}
        {...props}
        value={value}
        multiline={true}
        textAlignVertical="top"
        returnKeyType={isLastStep ? "done" : "default"}
        blurOnSubmit={false}
        onKeyPress={handleKeyPress}
        onSubmitEditing={handleSubmitEditing}
        onSelectionChange={handleSelectionChange}
        style={[
          {
            minHeight: 40,
            maxHeight: 120, // Limit height to prevent too much space
          },
          props.style
        ]}
      />
    );
  }
);

MultilineInstructionInput.displayName = 'MultilineInstructionInput';

export default MultilineInstructionInput;