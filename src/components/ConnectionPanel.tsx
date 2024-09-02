import React from 'react';
import { StopCircle, PlayCircle, Download, AlertCircle } from 'lucide-react';
import { Select } from './Select';
import { ConnectionOptions } from '../types';

interface ConnectionPanelProps {
  isConnected: boolean;
  connectToPort: () => Promise<void>;
  disconnectPort: () => Promise<void>;
  saveLog: () => void;
  error: string;
  connectionOptions: ConnectionOptions;
  handleOptionChange: (option: keyof ConnectionOptions, value: string | number) => void;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  isConnected,
  connectToPort,
  disconnectPort,
  saveLog,
  error,
  connectionOptions,
  handleOptionChange,
}) => {
  return (
    <div className="space-y-4 mb-4">
      <div className="flex space-x-4">
        <button 
          onClick={isConnected ? disconnectPort : connectToPort}
          className={`p-2 rounded-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isConnected ? <StopCircle size={24} color="white" /> : <PlayCircle size={24} color="white" />}
        </button>
        <button 
          onClick={saveLog}
          className="p-2 rounded bg-blue-500 hover:bg-blue-600"
          title="Save Log"
        >
          <Download size={24} color="white" />
        </button>
      </div>
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!isConnected && !error && (
        <div className="flex items-center space-x-2 text-yellow-600">
          <AlertCircle size={20} />
          <span>Not connected. Click the connect button to select a port.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select<string>
          label="Baud Rate"
          value={connectionOptions.baudRate.toString()}
          onChange={(value) => handleOptionChange('baudRate', parseInt(value))}
          options={[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(rate => ({ value: rate.toString(), label: rate.toString() }))}
        />
        <Select<string>
          label="Data Bits"
          value={connectionOptions.dataBits.toString()}
          onChange={(value) => handleOptionChange('dataBits', parseInt(value))}
          options={[7, 8].map(bits => ({ value: bits.toString(), label: bits.toString() }))}
        />
        <Select<string>
          label="Stop Bits"
          value={connectionOptions.stopBits.toString()}
          onChange={(value) => handleOptionChange('stopBits', parseInt(value))}
          options={[1, 2].map(bits => ({ value: bits.toString(), label: bits.toString() }))}
        />
        <Select<'none' | 'even' | 'odd'>
          label="Parity"
          value={connectionOptions.parity}
          onChange={(value) => handleOptionChange('parity', value)}
          options={['none', 'even', 'odd'].map(parity => ({ value: parity, label: parity }))}
        />
      </div>
    </div>
  );
};

export default ConnectionPanel;