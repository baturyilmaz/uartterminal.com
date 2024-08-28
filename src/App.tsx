import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { AlertCircle, Send, Trash2, PlayCircle, StopCircle, Moon, Sun, Copy, Download, ChevronDown } from 'lucide-react';

// Theme context to manage light and dark mode
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

// Select component for various terminal options
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
  const [sendFormat, setSendFormat] = useState('ascii');
  const [displayFormat, setDisplayFormat] = useState('auto');
  const [scrollBehavior, setScrollBehavior] = useState('auto');

  const outputRef = useRef(null);
  const bufferRef = useRef('');

  useEffect(() => {
    if (outputRef.current && scrollBehavior === 'auto') {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [receivedData, scrollBehavior]);

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
    const incompleteLine = lines.pop();

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
        let data;
        switch (sendFormat) {
          case 'ascii':
            data = new TextEncoder().encode(inputData);
            break;
          case 'hex':
            data = new Uint8Array(
              inputData.split(/\s+/)
                .filter(byte => byte !== '')
                .map(byte => parseInt(byte, 16))
            );
            break;
          case 'binary':
            data = new Uint8Array(inputData.split(/\s+/).map(byte => parseInt(byte, 2)));
            break;
          case 'decimal':
            data = new Uint8Array(inputData.split(/\s+/).map(byte => parseInt(byte, 10)));
            break;
          default:
            throw new Error('Unsupported send format');
        }
        await portInfo.writer.write(data);
        setReceivedData(prev => [...prev, { type: 'sent', text: inputData, timestamp: new Date(), format: sendFormat }]);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Temporary "Copied!" message
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const saveLog = () => {
    const logContent = receivedData.map(item => 
      `${formatTimestamp(item.timestamp)} ${item.type === 'sent' ? 'TX:' : 'RX:'} ${item.text}`
    ).join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'serial_log.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatReceivedData = (data, format) => {
    switch (format) {
      case 'hex':
        return data.split('').map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      case 'decimal':
        return data.split('').map(char => char.charCodeAt(0)).join(' ');
      case 'binary':
        return data.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      case 'ascii':
      default:
        return data;
    }
  };

  const renderReceivedData = (item) => {
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

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        return;
      }
      
      if (e.ctrlKey) {
        e.preventDefault();
        const { selectionStart, selectionEnd, value } = e.target;
        const newValue = value.substring(0, selectionStart) + '\t' + value.substring(selectionEnd);
        setInputData(newValue);
        
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + 1;
        }, 0);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white">
      <div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">TermiWeb</h1>
          <button onClick={toggleDarkMode} className="p-2 rounded-full">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col p-4 max-w-4xl mx-auto w-full">
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
        
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Received Data</h2>
          <div className="flex items-center space-x-2">
            <Select
              label="Scroll"
              value={scrollBehavior}
              onChange={setScrollBehavior}
              options={[
                { value: 'auto', label: 'Auto-scroll' },
                { value: 'manual', label: 'Manual scroll' }
              ]}
            />
            <Select
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
              onChange={(e) => setSendFormat(e.target.value)}
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