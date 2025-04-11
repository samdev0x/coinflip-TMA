import React from 'react';
import { Input } from 'pixel-retroui';

const ThemedInput: React.FC = () => {
  return (
    <Input
      bg="#fefcd0" // Background color
      textColor="black" // Text color
      borderColor="black" // Border color
      placeholder="Enter text..." // Placeholder text
      onChange={(e) => console.log(e.target.value)} // Handle input change
    />
  );
};

export default ThemedInput;
