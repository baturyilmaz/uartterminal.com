import React, { useRef, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { Select } from './Select';
import { ReceivedDataItem } from '../types';

interface DataDisplayProps {
  receivedData: ReceivedDataItem[];
  displayFormat: 'auto' | 'ascii' | 'hex' | 'decimal' | 'binary';
  setDisplayFormat: React.Dispatch<React.SetStateAction<'auto' | 'ascii' | 'hex' | 'decimal' | 'binary'>>;
  scrollBehavior: 'auto' | 'manual';
  setScrollBehavior: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
}

const DataDisplay: React.FC<DataDisplayProps> = ({
  receivedData,
  displayFormat,
  setDisplayFormat,
  scrollBehavior,
  setScrollBehavior,
}) => {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current && scrollBehavior === 'auto') {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [receivedData, scrollBehavior]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Temporary "Copied!" message
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const formatReceivedData = (data: string, format: string): string => {
    switch (format) {
      case 'hex':
        return data.split('').map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      case 'decimal':
        return data.split('').map(char => char.charCodeAt(0).toString()).join(' ');
      case 'binary':
        return data.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      case 'ascii':
      default:
        return data;
    }
  };

  const renderReceivedData = (item: ReceivedDataItem) => {
    let formattedText;
    if (displayFormat === 'auto') {
      formattedText = item.text;
    } else {
      formattedText = formatReceivedData(item.text, displayFormat);
    }

    return (
      <div key={item.timestamp.getTime()} className={`mb-1 flex items-center justify-between ${item.type === 'sent' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{formatTimestamp(item.timestamp)}</span>
          <span className="font-bold mr-2">{item.type === 'sent' ? 'TX:' : 'RX:'}</span>
          <span className="font-mono">{formattedText}</span>
        </div>
        <button 
          onClick={() => copyToClipboard(formattedText)}
          className="p-1 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Copy"
        >
          <Copy size={16} />
        </button>
      </div>
    );
  };

  const handleScroll = () => {
    if (outputRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 1;
      if (!isScrolledToBottom && scrollBehavior === 'auto') {
        setScrollBehavior('manual');
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Received Data</h2>
        <div className="flex items-center space-x-2">
          <Select<'auto' | 'manual'>
            label="Scroll"
            value={scrollBehavior}
            onChange={setScrollBehavior}
            options={[
              { value: 'auto', label: 'Auto-scroll' },
              { value: 'manual', label: 'Manual scroll' }
            ]}
          />
          <Select<'auto' | 'ascii' | 'hex' | 'decimal' | 'binary'>
            label="Display Format"
            value={displayFormat}
            onChange={setDisplayFormat}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'ascii', label: 'ASCII' },
              { value: 'hex', label: 'Hexadecimal' },
              { value: 'decimal', label: 'Decimal' },
              { value: 'binary', label: 'Binary' }
            ]}
          />
        </div>
      </div>
      
      <div 
        ref={outputRef} 
        className="flex-grow overflow-y-auto border rounded p-2 bg-gray-100 dark:bg-gray-800 mb-4"
        style={{ minHeight: '200px', maxHeight: 'calc(100vh - 400px)' }}
        onScroll={handleScroll}
      >
        {receivedData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No data received yet...</p>
        ) : (
          receivedData.map(renderReceivedData)
        )}
      </div>
    </>
  );
};

export default DataDisplay;