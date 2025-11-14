// Minimal Express server that serves static files and provides /api/chat
const app = express();
app.use(cors());
app.use(bodyParser.json());


// SESSION STORE
// Simple in-memory map: { client_id: [ {role, content, ts}, ... ] }
// Replace with Supabase / Firestore / Postgres for persistence in production
const sessions = new Map();


// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));


// Health
app.get('/api/health', (req, res) => res.json({status: 'ok', now: Date.now()}));


// POST /api/chat
// body: { client_id, message }
app.post('/api/chat', async (req, res) => {
try {
let { client_id, message } = req.body;
if (!message) return res.status(400).json({ error: 'message required' });


if (!client_id) {
client_id = uuidv4();
}


if (!sessions.has(client_id)) sessions.set(client_id, []);


const history = sessions.get(client_id);


const userMsg = { role: 'user', content: String(message), ts: Date.now() };
history.push(userMsg);


// ===== Here: integrate with real AI (OpenAI) or your bot =====
// For demo we echo back and append a small bot reply.


const botReplyText = `Bot reply (echo): ${message}`;
const botMsg = { role: 'bot', content: botReplyText, ts: Date.now() };
history.push(botMsg);


// respond with client_id (so frontend can set it if newly generated) and the reply
res.json({ client_id, reply: botMsg, history });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'internal' });
}
});


// Optional endpoint to fetch history
app.get('/api/history/:client_id', (req, res) => {
const id = req.params.client_id;
const history = sessions.get(id) || [];
res.json({ client_id: id, history });
});


// fallback to index.html for SPA routing
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));