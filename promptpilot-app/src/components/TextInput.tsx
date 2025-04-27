import React from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TextInputProps extends RNTextInputProps {
  // Zusätzliche Props hier hinzufügen, falls benötigt
}

const TextInput: React.FC<TextInputProps> = (props) => {
  const { colors } = useTheme();
  
  return (
    <RNTextInput
      {...props}
      style={[
        {
          color: colors.text,
          fontSize: 16,
        },
        props.style,
      ]}
      placeholderTextColor={props.placeholderTextColor || colors.placeholder}
    />
  );
};

export default TextInput;
