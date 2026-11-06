const http = require('http');

let totalSeconds = 0;

// Increment the server-side timer every second globally
setInterval(() => {
  totalSeconds++;
}, 1000);

const server = http.createServer((req, res) => {
  // 1. Serve the HTML Interface
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Server-Side Timer (SSE)</title>
        <style>
          body {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #eef2f3;
          }
          #timer {
            font-size: 3.5rem;
            font-weight: bold;
            color: #2c3e50;
          }
        </style>
      </head>
      <body>
        <h2>Strictly Server-Side Timer</h2>
        <div id="timer">Waiting for server...</div>

        <script>
          // Listen to the native Node.js server event stream
          const eventSource = new EventSource('/timer');
          
          eventSource.onmessage = function(event) {
            document.getElementById('timer').textContent = event.data;
          };

          eventSource.onerror = function() {
            document.getElementById('timer').textContent = "Connection lost.";
          };
        </script>
      </body>
      </html>
    `);
    return;
  }

  // 2. Stream the Server-Side Timer Data
  if (req.url === '/timer') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Helper function to format seconds into HH:MM:SS
    const formatTime = (seconds) => {
      const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    };

    // Send the current time immediately upon connection
    res.write(`data: ${formatTime(totalSeconds)}\n\n`);

    // Stream updates to this specific client every second
    const intervalId = setInterval(() => {
      res.write(`data: ${formatTime(totalSeconds)}\n\n`);
    }, 1000);

    // Clean up when the user closes the browser tab
    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });
    return;
  }

  // 404 Catch-all
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});