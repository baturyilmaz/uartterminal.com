import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Send, Trash2, PlayCircle, StopCircle } from 'lucide-react';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [receivedData, setReceivedData] = useState('');
  const [inputData, setInputData] = useState('');
  const [portInfo, setPortInfo] = useState({ port: null, reader: null, writer: null });
  const [error, setError] = useState('');

  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [receivedData]);

  const connectToPort = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">TermiWeb</h1>
      
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
      
      <div ref={outputRef} className="border rounded p-2 h-64 overflow-auto bg-gray-100">
        <pre className="whitespace-pre-wrap">{receivedData || 'No data received yet...'}</pre>
      </div>
      
      <div className="flex space-x-2">
        <input 
          type="text" 
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Enter data to send..."
          className="flex-grow p-2 border rounded"
          disabled={!isConnected}
        />
        <button 
          onClick={sendData}
          disabled={!isConnected}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded disabled:bg-gray-300"
        >
          <Send size={24} color="white" />
        </button>
        <button 
          onClick={clearData}
          className="p-2 bg-gray-500 hover:bg-gray-600 rounded"
        >
          <Trash2 size={24} color="white" />
        </button>
      </div>
    </div>
  );
};

export default App;