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
  const [receivedData, setReceivedData] = useState([]);
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
  const bufferRef = useRef('');

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

      readLoop(reader);
    } catch (err) {
      console.error('Error connecting to port:', err);
      setError('Failed to connect. Please try again.');
    }
  };

  const processBuffer = (buffer) => {
    const lines = buffer.split(/[\r\n]+/);
    const incompleteLine = lines.pop(); // This might be an incomplete line

    lines.forEach(line => {
      if (line.trim() !== '') {
        setReceivedData(prev => [...prev, { type: 'received', text: line, timestamp: new Date() }]);
      }
    });

    return incompleteLine;
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
          bufferRef.current += text;
          bufferRef.current = processBuffer(bufferRef.current);
        }
      }
    } catch (err) {
      console.error('Error in read loop:', err);
      setError('Connection lost. Please reconnect.');
      setIsConnected(false);
      setPortInfo({ port: null, reader: null, writer: null });
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
        const data = new TextEncoder().encode(inputData);
        await portInfo.writer.write(data);
        setReceivedData(prev => [...prev, { type: 'sent', text: inputData, timestamp: new Date() }]);
        setInputData('');
      } catch (err) {
        console.error('Error sending data:', err);
        setError('Failed to send data. Connection may be lost. Please reconnect.');
        setIsConnected(false);
        setPortInfo({ port: null, reader: null, writer: null });
      }
    }
  };

  const clearData = () => {
    setReceivedData([]);
    bufferRef.current = '';
  };

  const handleOptionChange = (option, value) => {
    setConnectionOptions(prev => ({ ...prev, [option]: value }));
  };

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white">
      <div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">TermiWeb</h1>
          <button onClick={toggleDarkMode} className="p-2 rounded-full">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden p-4 max-w-4xl mx-auto w-full">
        <div className="flex-shrink-0 space-y-4 mb-4">
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
        </div>
        
        <div ref={outputRef} className="flex-grow overflow-y-auto border rounded p-2 bg-gray-100 dark:bg-gray-800 mb-4">
          {receivedData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No data received yet...</p>
          ) : (
            receivedData.map((item, index) => (
              <div key={index} className={`mb-1 ${item.type === 'sent' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{formatTimestamp(item.timestamp)}</span>
                <span className="font-bold mr-2">{item.type === 'sent' ? 'TX:' : 'RX:'}</span>
                <span className="font-mono">{item.text}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="flex-shrink-0 flex space-x-2">
          <input 
            type="text" 
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendData()}
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