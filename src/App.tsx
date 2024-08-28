import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { AlertCircle, Send, Trash2, PlayCircle, StopCircle, Moon, Sun } from 'lucide-react';

const ThemeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check for user's preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

const Select = ({ value, onChange, options, label }) => {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const App = () => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedData, setReceivedData] = useState('');
  const [inputData, setInputData] = useState('');
  const [portInfo, setPortInfo] = useState({ port: null, reader: null, writer: null });
  const [error, setError] = useState('');
  const [connectionOptions, setConnectionOptions] = useState({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  });

  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [receivedData]);

  const connectToPort = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open(connectionOptions);

      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();

      setPortInfo({ port, reader, writer });
      setIsConnected(true);
      setError('');

      // Start reading loop
      readLoop(reader);
    } catch (err) {
      console.error('Error connecting to port:', err);
      setError('Failed to connect. Please try again.');
    }
  };

  const readLoop = async (reader) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Reader has been canceled');
          break;
        }
        if (value) {
          const text = new TextDecoder().decode(value);
          setReceivedData(prev => prev + text);
          console.log(text);
        }
      }
    } catch (err) {
      console.error('Error in read loop:', err);
    } finally {
      reader.releaseLock();
    }
  };

  const disconnectPort = async () => {
    if (portInfo.reader) {
      await portInfo.reader.cancel();
    }
    if (portInfo.writer) {
      await portInfo.writer.close();
    }
    if (portInfo.port) {
      await portInfo.port.close();
    }
    setIsConnected(false);
    setPortInfo({ port: null, reader: null, writer: null });
  };

  const sendData = async () => {
    if (inputData.trim() && portInfo.writer) {
      try {
        const data = new TextEncoder().encode(inputData + '\n');
        await portInfo.writer.write(data);
        setReceivedData(prev => prev + `Sent: ${inputData}\n`);
        setInputData('');
      } catch (err) {
        console.error('Error sending data:', err);
        setError('Failed to send data. Please try reconnecting.');
      }
    }
  };

  const clearData = () => {
    setReceivedData('');
  };

  const handleOptionChange = (option, value) => {
    setConnectionOptions(prev => ({ ...prev, [option]: value }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">TermiWeb</h1>
          <button onClick={toggleDarkMode} className="p-2 rounded-full">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={isConnected ? disconnectPort : connectToPort}
            className={`p-2 rounded-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isConnected ? <StopCircle size={24} color="white" /> : <PlayCircle size={24} color="white" />}
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
          <Select
            label="Baud Rate"
            value={connectionOptions.baudRate.toString()}
            onChange={(value) => handleOptionChange('baudRate', parseInt(value))}
            options={[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(rate => ({ value: rate.toString(), label: rate.toString() }))}
          />
          <Select
            label="Data Bits"
            value={connectionOptions.dataBits.toString()}
            onChange={(value) => handleOptionChange('dataBits', parseInt(value))}
            options={[7, 8].map(bits => ({ value: bits.toString(), label: bits.toString() }))}
          />
          <Select
            label="Stop Bits"
            value={connectionOptions.stopBits.toString()}
            onChange={(value) => handleOptionChange('stopBits', parseInt(value))}
            options={[1, 2].map(bits => ({ value: bits.toString(), label: bits.toString() }))}
          />
          <Select
            label="Parity"
            value={connectionOptions.parity}
            onChange={(value) => handleOptionChange('parity', value)}
            options={['none', 'even', 'odd'].map(parity => ({ value: parity, label: parity }))}
          />
        </div>
        
        <div ref={outputRef} className="border rounded p-2 h-64 overflow-auto bg-gray-100 dark:bg-gray-800">
          <pre className="whitespace-pre-wrap">{receivedData || 'No data received yet...'}</pre>
        </div>
        
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Enter data to send..."
            className="flex-grow p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
            disabled={!isConnected}
          />
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
      </div>
    </div>
  );
};

const WrappedApp = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default WrappedApp;