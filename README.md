# UART Terminal

UART Terminal is a web-based application for serial communication. There are already some great serial terminals out there, but I wanted to create one that I could easily access and customize with my own features. This project uses the WebSerial API to make it all happen.
My hope is that this will grow into a collaborative project, bringing together different ideas and eventually becoming a user-friendly serial terminal for Chromium-based browsers. I've got some previous experience with React, so I decided to go with that for this project. I was able to build the initial skeleton pretty quickly, thanks to some help from GPT 4o.
You can access UART Terminal by visiting www.uartterminal.com, or if you prefer, you can clone the repository and run it locally.
I'm open to any and all collaboration - if you've got ideas or want to contribute, I'd really appreciate it!

## Features

- Connect to serial ports with customizable connection options
- Send and receive data in various formats (ASCII, Hexadecimal, Binary, Decimal)
- Auto-scrolling and manual scrolling options for received data
- Dark mode support
- Save communication logs
- Responsive design for use on different devices

I will be adding various features, with my first goal being to implement ANSI terminal capabilities similar to Hyper Terminal. Here are some other ideas (thanks again to GPT-4) that I will be considering.

- Data Visualization: Implement real-time graphing and charting capabilities for numeric data streams.
- Data Logging and Export: Enhance data logging capabilities with various export formats (CSV, JSON, etc.) and integrate cloud storage options.
- Collaborative Features: Add real-time collaboration features, allowing multiple users to view and interact with the same serial connection.(?)

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Web Serial API

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (version 12.0 or higher)
- npm (usually comes with Node.js)
- A Chromium based web browser that supports the Web Serial API (e.g., Chrome, Edge)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/baturyilmaz/uartterminal.com.git
   ```

2. Navigate to the project directory:
   ```
   cd uartterminal.com
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your web browser and navigate to `http://localhost:XXXX`

3. Configure the connection settings (baud rate, data bits, stop bits, parity)

4. Click the connect button to select a serial port

5. Once connected, you can send and receive data through the serial port

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit your change
5. Push to the branch
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- [GPT 4o](https://chatgpt.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Lucide Icons](https://lucide.dev/)