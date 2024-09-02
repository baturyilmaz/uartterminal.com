import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import ConnectionPanel from './components/ConnectionPanel';
import DataDisplay from './components/DataDisplay';
import InputPanel from './components/InputPanel';
import { PortInfo, ReceivedDataItem, ConnectionOptions } from './types';
import { Copy } from 'lucide-react';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [receivedData, setReceivedData] = useState<ReceivedDataItem[]>([]);
  const [inputData, setInputData] = useState('');
  const [portInfo, setPortInfo] = useState<PortInfo>({ port: null, reader: null, writer: null });
  const [error, setError] = useState('');
  const [connectionOptions, setConnectionOptions] = useState<ConnectionOptions>({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  });
  const [sendFormat, setSendFormat] = useState<'ascii' | 'hex' | 'binary' | 'decimal'>('ascii');
  const [displayFormat, setDisplayFormat] = useState<'auto' | 'ascii' | 'hex' | 'decimal' | 'binary'>('auto');
  const [scrollBehavior, setScrollBehavior] = useState<'auto' | 'manual'>('auto');

  const bufferRef = useRef('');
  const outputRef = useRef<HTMLDivElement>(null);

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

  const processBuffer = (buffer: string) => {
    const lines = buffer.split(/[\r\n]+/);
    const incompleteLine = lines.pop();

    lines.forEach(line => {
      if (line.trim() !== '') {
        setReceivedData(prev => [...prev, { type: 'received', text: line, timestamp: new Date() }]);
      }
    });

    return incompleteLine || '';
  };

  const readLoop = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
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
        let data: Uint8Array;
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

  const handleOptionChange = (option: keyof ConnectionOptions, value: string | number) => {
    setConnectionOptions(prev => ({ ...prev, [option]: value }));
  };

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

  const saveLog = () => {
    const logContent = receivedData.map(item => {
      let formattedText;
      if (displayFormat === 'auto') {
        formattedText = item.text;
      } else {
        formattedText = formatReceivedData(item.text, displayFormat);
      }
      return `${formatTimestamp(item.timestamp)} ${item.type === 'sent' ? 'TX:' : 'RX:'} ${formattedText}`;
    }).join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `serial_log_${displayFormat}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white">
        <Header />
        <div className="flex-grow flex flex-col p-4 max-w-4xl mx-auto w-full">
          <ConnectionPanel
            isConnected={isConnected}
            connectToPort={connectToPort}
            disconnectPort={disconnectPort}
            saveLog={saveLog}
            error={error}
            connectionOptions={connectionOptions}
            handleOptionChange={handleOptionChange}
          />
          <DataDisplay
            receivedData={receivedData}
            displayFormat={displayFormat}
            setDisplayFormat={setDisplayFormat}
            scrollBehavior={scrollBehavior}
            setScrollBehavior={setScrollBehavior}
            handleScroll={handleScroll}
            outputRef={outputRef}
            renderReceivedData={renderReceivedData}
          />
          <InputPanel
            inputData={inputData}
            setInputData={setInputData}
            sendData={sendData}
            sendFormat={sendFormat}
            setSendFormat={setSendFormat}
            isConnected={isConnected}
            clearData={clearData}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;