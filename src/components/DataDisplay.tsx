import React, { useEffect } from 'react';
import { Select } from './Select';
import { ReceivedDataItem } from '../types';

interface DataDisplayProps {
  receivedData: ReceivedDataItem[];
  displayFormat: 'auto' | 'ascii' | 'hex' | 'decimal' | 'binary';
  setDisplayFormat: React.Dispatch<React.SetStateAction<'auto' | 'ascii' | 'hex' | 'decimal' | 'binary'>>;
  scrollBehavior: 'auto' | 'manual';
  setScrollBehavior: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
  handleScroll: () => void;
  outputRef: React.RefObject<HTMLDivElement>;
  renderReceivedData: (item: ReceivedDataItem) => React.ReactNode;
}

const DataDisplay: React.FC<DataDisplayProps> = ({
  receivedData,
  displayFormat,
  setDisplayFormat,
  scrollBehavior,
  setScrollBehavior,
  handleScroll,
  outputRef,
  renderReceivedData
}) => {
  useEffect(() => {
    if (outputRef.current && scrollBehavior === 'auto') {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [receivedData, scrollBehavior, outputRef]);

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