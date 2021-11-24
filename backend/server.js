import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

// Connections array
let connections = [];

// Server port
const port = process.env.PORT || 8080;

// Create messages array that's limited to 50 entries
const msg = new nanobuffer(50);

// Get newest messages
const getMsgs = () => Array.from(msg).reverse();

// Create initial test message
msg.push({
  user: "the_moon",
  text: "Hello!",
  time: Date.now(),
});

// Set up server for static assets
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json",
    "\r\n",
  ];

  socket.write(headers.join("\r\n"));

  socket.write(objToResponse({ msg: getMsgs() }));
  connections.push(socket);

  socket.on("data", buffer => {
    const message = parseMessage(buffer);

    if (message) {
      msg.push({
        user: message.user,
        text: message.text,
        time: Date.now(),
      });

      // Writes messages to all of the open connections
      connections.forEach(s => {
        s.write(objToResponse({ msg: getMsgs() }));
      });
    } else if (message === null) {
      socket.end(); // Close the connection (message is empty)
    }
  });

  socket.on("end", () => {
    connections = connections.filter(s => s !== socket);
  });
});

server.listen(port, () => console.log(`Server running at http://localhost:${port}`));
