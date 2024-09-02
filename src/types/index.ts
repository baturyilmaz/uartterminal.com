export interface ConnectionOptions {
    baudRate: number;
    dataBits: number;
    stopBits: number;
    parity: 'none' | 'even' | 'odd';
  }
  
  export interface SerialPort {
    open: (options: ConnectionOptions) => Promise<void>;
    close: () => Promise<void>;
    readable: ReadableStream;
    writable: WritableStream;
  }
  
  export interface PortInfo {
    port: SerialPort | null;
    reader: ReadableStreamDefaultReader<Uint8Array> | null;
    writer: WritableStreamDefaultWriter<Uint8Array> | null;
  }
  
  export interface ReceivedDataItem {
    type: 'sent' | 'received';
    text: string;
    timestamp: Date;
    format?: string;
  }
  
  export interface SelectOption {
    value: string;
    label: string;
  }
  
  // Declare global navigator.serial
  declare global {
    interface Navigator {
      serial: any;
    }
  }