// Very small client app without build step so you can deploy as-is.
const msg = document.createElement('div');
msg.className = 'msg ' + (item.role === 'user' ? 'user' : 'bot');
msg.textContent = item.content;
div.appendChild(msg);
historyEl.appendChild(div);

historyEl.scrollTop = historyEl.scrollHeight;



async function fetchHistory(){
try{
const r = await fetch(`/api/history/${clientId}`);
if (!r.ok) return;
const j = await r.json();
renderHistory(j.history||[]);
}catch(e){console.warn(e)}
}


async function send(){
const txt = inputEl.value.trim();
if (!txt) return;
inputEl.value = '';


// optimistic render
const prev = [];
const userMsg = { role:'user', content: txt };
prev.push(userMsg);
renderHistory((await getCurrentHistory()).concat(prev));


try{
const res = await fetch('/api/chat', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ client_id: clientId, message: txt })
});
if (!res.ok) throw new Error('bad');
const j = await res.json();


// if server returns a new client_id (rare) — update localStorage
if (j.client_id && j.client_id !== clientId){
clientId = j.client_id;
localStorage.setItem('client_id', clientId);
clientIdEl.textContent = clientId;
}


renderHistory(j.history || []);
}catch(err){
console.error(err);
// on error just fetch last-known history
await fetchHistory();
}
}


// helper to get displayed history from server for optimistic rendering
async function getCurrentHistory(){
try{
const r = await fetch(`/api/history/${clientId}`);
const j = await r.json();
return j.history||[];
}catch(e){return []}
}


sendBtn.addEventListener('click', send);
inputEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') send(); });


// initial load
fetchHistory();
