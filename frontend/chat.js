const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const indicator = document.getElementById("indicator");

// Store current messages
let allChat = [];

// Server port
const port = 8080;

// Listen for submit
chat.addEventListener("submit", function (event) {
  event.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = ""; // Empty the input
});

// Post new messages to the server
async function postNewMsg(user, text) {
  const data = { user, text };

  ws.send(JSON.stringify(data));
}

// Initialize Web Socket on same port as server
const ws = new WebSocket(`ws://localhost:${port}`, ["json"]);

// Listen for server running
ws.addEventListener("open", () => {
  console.log("Connected");

  indicator.innerText = "🟢";
});

// Listen for new messages
ws.addEventListener("message", event => {
  const data = JSON.parse(event.data);

  allChat = data.msg;

  render();
});

// Listen for closed connection
ws.addEventListener("close", () => {
  indicator.innerText = "🔴";
});

// Render new messages in HTML
const template = (user, msg) => `<li>${user} - ${msg}</li>`;

function render() {
  const html = allChat.map(({ user, text, time, id }) => {
    return template(user, text, time, id);
  });

  msgs.innerHTML = html.join("\n");
}
