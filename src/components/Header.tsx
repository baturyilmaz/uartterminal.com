import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Header: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">UART Terminal</h1>
        <button onClick={toggleDarkMode} className="p-2 rounded-full">
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
    </div>
  );
};

export default Header;