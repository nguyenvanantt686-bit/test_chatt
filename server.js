const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const chatHistory = [];
const clients = []; // SSE clients

// SSE endpoint
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // gửi lịch sử hiện tại cho client mới
  res.write(`data: ${JSON.stringify(chatHistory)}\n\n`);

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  req.on('close', () => {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) clients.splice(index, 1);
  });
});

// API nhận tin nhắn
app.post('/api/chat', (req, res) => {
  const { name, client_id, message } = req.body;
  if (!message || !client_id || !name) return res.status(400).send('Missing data');

  // tạo tin nhắn user
  const userMsg = { role: 'user', content: message, name, client_id, ts: Date.now() };
  chatHistory.push(userMsg);

  // tạo tin nhắn bot
  const botMsg = { role: 'bot', content: `${name} vừa gửi "${message}"`, ts: Date.now() };
  chatHistory.push(botMsg);

  // gửi cả user + bot tới tất cả client
  clients.forEach(c => c.res.write(`data: ${JSON.stringify([userMsg, botMsg])}\n\n`));

  res.json({ status: 'ok' }); // client gửi không cần append riêng nữa
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
