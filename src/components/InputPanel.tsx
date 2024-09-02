import React from 'react';
import { Send, Trash2, ChevronDown } from 'lucide-react';

interface InputPanelProps {
  inputData: string;
  setInputData: React.Dispatch<React.SetStateAction<string>>;
  sendData: () => Promise<void>;
  sendFormat: 'ascii' | 'hex' | 'binary' | 'decimal';
  setSendFormat: React.Dispatch<React.SetStateAction<'ascii' | 'hex' | 'binary' | 'decimal'>>;
  isConnected: boolean;
  clearData: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  inputData,
  setInputData,
  sendData,
  sendFormat,
  setSendFormat,
  isConnected,
  clearData,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        return;
      }
      
      if (e.ctrlKey) {
        e.preventDefault();
        const target = e.target as HTMLInputElement;
        const { selectionStart, selectionEnd, value } = target;
        const newValue = value.substring(0, selectionStart!) + '\t' + value.substring(selectionEnd!);
        setInputData(newValue);
        
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart! + 1;
        }, 0);
      }
    }
  };

  return (
    <div className="flex-shrink-0 flex space-x-2">
      <input 
        type="text" 
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendData()}
        onKeyDown={handleKeyDown}
        placeholder="Enter data to send... (Ctrl+Tab to insert tab)"
        className="flex-grow p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
        disabled={!isConnected}
      />
      <div className="relative">
        <select
          value={sendFormat}
          onChange={(e) => setSendFormat(e.target.value as 'ascii' | 'hex' | 'binary' | 'decimal')}
          className="appearance-none bg-gray-200 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-full"
        >
          <option value="ascii">ASCII</option>
          <option value="hex">HEX</option>
          <option value="binary">Binary</option>
          <option value="decimal">Decimal</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <ChevronDown size={16} />
        </div>
      </div>
      <button 
        onClick={sendData}
        disabled={!isConnected}
        className="p-2 rounded disabled:bg-gray-300 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        <Send size={24} color="white" />
      </button>
      <button 
        onClick={clearData}
        className="p-2 rounded bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
      >
        <Trash2 size={24} color="white" />
      </button>
    </div>
  );
};

export default InputPanel;