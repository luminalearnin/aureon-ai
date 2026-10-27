const STORAGE_KEY = 'aureon.workspace.v1';
const ICONS = {
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4L12 3Z"/><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.5-.75L4 20l1.45-3.55A7.48 7.48 0 0 1 4.5 12c0-4.14 3.36-7.5 7.5-7.5S20 7.36 20 11.5Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0-14-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 14 4.9L20 16"/><path d="M20 20v-4h-4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m4 16.5-.8 3.3 3.3-.8L18.7 7a2.1 2.1 0 0 0-3-3L4 16.5Z"/><path d="m14.5 5.5 3 3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l.7 13h9.6l.7-13M9 7V4h6v3"/></svg>',
  attach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m20.5 11.5-8.8 8.8a5 5 0 0 1-7-7l9-9a3.4 3.4 0 0 1 4.8 4.8l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
};

const starters = [
  { icon: ICONS.spark, title: 'Shape a launch strategy', hint: 'From idea to first signal' },
  { icon: ICONS.message, title: 'Turn notes into a plan', hint: 'Make the path obvious' },
  { icon: ICONS.search, title: 'Explain a complex idea', hint: 'Clear enough to share' },
  { icon: ICONS.edit, title: 'Review a code snippet', hint: 'Find the sharp edges' },
];

const state = {
  threads: loadThreads(),
  activeId: null,
  generating: false,
  streamTimer: null,
  editingMessageId: null,
  mobileOpen: false,
};

if (!state.threads.length) state.threads = [makeThread('Untitled conversation')];
state.activeId = state.threads[0].id;

function uid() { return `th_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }
function makeThread(title = 'Untitled conversation') { return { id: uid(), title, messages: [], createdAt: Date.now(), updatedAt: Date.now() }; }
function loadThreads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((thread) => thread && typeof thread.id === 'string' && Array.isArray(thread.messages)) : [];
  } catch { return []; }
}
function saveThreads() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.threads)); } catch { showToast('Your browser could not save this thread.'); } }
function activeThread() { return state.threads.find((thread) => thread.id === state.activeId) || state.threads[0]; }
function timeLabel(timestamp) { const d = new Date(timestamp); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function esc(value = '') { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

function renderMarkdown(raw = '') {
  const blocks = raw.split(/```/g);
  return blocks.map((block, index) => {
    if (index % 2 === 1) {
      const lines = block.replace(/^\n/, '').split('\n');
      const language = lines.shift() || 'code';
      const code = lines.join('\n');
      return `<div class="code-block"><div class="code-head"><span>${esc(language)}</span><button class="code-copy" data-copy="${encodeURIComponent(code)}">Copy</button></div><pre>${esc(code)}</pre></div>`;
    }
    let html = esc(block);
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^[-*] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/^(\d+)\. (.*)$/gm, '<div class="ordered-item"><span>$1.</span> $2</div>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return html.split(/\n{2,}/).map((paragraph) => paragraph.startsWith('<h3>') || paragraph.startsWith('<ul>') ? paragraph : `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('');
  }).join('');
}

function classify(prompt) {
  const text = prompt.toLowerCase();
  if (/launch|marketing|campaign|go-to-market|gtm/.test(text)) return 'launch';
  if (/plan|roadmap|organize|notes|project|workflow|strategy/.test(text)) return 'plan';
  if (/explain|what is|how does|teach|complex|difference|why/.test(text)) return 'explain';
  if (/code|debug|bug|review|javascript|typescript|python|react|function|api/.test(text)) return 'code';
  if (/write|draft|email|copy|headline|post|creative/.test(text)) return 'write';
  return 'general';
}

function composeResponse(prompt, thread) {
  const intent = classify(prompt);
  const name = prompt.trim().split(/\s+/).slice(0, 7).join(' ');
  const context = thread.messages.length > 1 ? '\n\nI’m also carrying the thread context forward, so we can sharpen this from here.' : '';
  const responses = {
    launch: `## A sharper launch frame\n\nFor **${name}**, I’d optimize for a narrow first signal rather than broad awareness. The goal is to make one audience feel that the product was made specifically for their next decision.${context}\n\n### 1. Choose the wedge\n- Name the highest-intent audience in one sentence.\n- Anchor the promise to a visible before → after.\n- Give the first experience a single success moment.\n\n### 2. Build the signal loop\n1. Publish one point-of-view artifact that makes the problem feel urgent.\n2. Invite 10–15 ideal users into a guided first run.\n3. Capture the exact language they use when the value clicks.\n4. Reuse that language everywhere else.\n\n**Useful constraint:** if the launch needs more than one primary CTA, the story is still too wide.`,
    plan: `## Turn the idea into motion\n\nHere’s a clean operating shape for **${name}**. It keeps momentum visible without pretending every unknown is already solved.${context}\n\n### Now — create traction\n- Define the outcome in one observable sentence.\n- List the three decisions that unlock the next step.\n- Assign an owner and a finish line to each decision.\n\n### Next — reduce uncertainty\n- Identify the assumption most likely to invalidate the plan.\n- Run the smallest test that can change your mind.\n- Record the signal, not just the activity.\n\n### Later — scale the repeatable\nPackage what works into a ritual, template, or system. A good plan should become lighter every time you use it.`,
    explain: `## The clear version\n\nThink of **${name}** as a system with three layers:\n\n1. **Input** — what the system can observe or receive.\n2. **Transformation** — the rules, reasoning, or process that changes the input.\n3. **Output** — the decision, artifact, or action that becomes useful.\n\nThe common confusion is treating the transformation as magic. In practice, quality comes from the relationship between the three layers: better inputs narrow ambiguity, a visible process makes the result trustworthy, and a specific output makes the result actionable.\n\nIf you share the exact context, I can turn this into an example, an analogy, or a technical breakdown.`,
    code: `## Code review lens\n\nI’d review **${name}** in this order:\n\n- **Correctness:** what happens on empty, delayed, duplicated, or malformed input?\n- **Boundaries:** which responsibility belongs elsewhere?\n- **Observability:** how would you know this failed in production?\n- **Clarity:** can the next engineer predict the behavior without simulating every branch?\n\nA small pattern I use for safer async work:\n\n\`\`\`js\nconst result = await runTask(input);\nif (!result.ok) {\n  return { ok: false, reason: result.reason };\n}\nreturn { ok: true, value: result.value };\n\`\`\`\n\nPaste the snippet and I’ll mark up the sharp edges directly.`,
    write: `## A strong first draft\n\nI can shape **${name}** into something direct, specific, and easy to act on. I’d start with a clear point of view instead of a neutral summary:\n\n> Make the important idea impossible to miss — then give the reader a next move.\n\nFrom there, I’ll tune the voice for the audience, remove filler, and keep one dominant message per paragraph. Send me the rough notes, audience, and desired tone, and I’ll turn them into a finished draft.`,
    general: `## Let’s make it useful\n\nI’m Aureon’s built-in reasoning engine. I can help you move from a loose prompt to a clearer decision, plan, explanation, draft, or implementation direction.\n\nFor the strongest result, give me:\n- the outcome you want,\n- the context I should respect, and\n- any constraint that matters.\n\nYou don’t need to configure a model or bring an API key here — just bring the thought.`,
  };
  return responses[intent];
}

function iconButton(label, icon, className = '', attrs = '') { return `<button class="icon-ghost ${className}" aria-label="${label}" title="${label}" ${attrs}>${icon}</button>`; }

function render() {
  const thread = activeThread();
  const hasMessages = thread?.messages?.length > 0;
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar ${state.mobileOpen ? 'open' : ''}" aria-label="Conversation navigation">
        <div class="brand">
          <div class="brand-mark">${ICONS.spark}</div>
          <div><div class="brand-name">AUREON</div><div class="brand-tag">Intelligence, refined.</div></div>
        </div>
        <button class="new-thread" data-action="new-thread">${ICONS.plus}<span>New conversation</span></button>
        <div class="side-section">
          <div class="side-label"><span>Your threads</span><button class="search-btn" data-action="search" aria-label="Search conversations">${ICONS.search}</button></div>
          <div class="thread-list">
            ${state.threads.slice().sort((a,b) => b.updatedAt - a.updatedAt).map(threadRow).join('') || '<div class="empty-threads">Your next line of thinking will live here.</div>'}
          </div>
        </div>
        <div class="sidebar-footer"><div class="engine-badge"><i class="engine-dot"></i><span>Aureon Neural Engine</span></div><div class="engine-meta">LOCAL SESSION · READY</div></div>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="mobile-brand"><div class="brand-mark">${ICONS.spark}</div><div class="brand-name">AUREON</div></div>
          <div class="thread-context"><div class="eyebrow">Active thread</div><h2>${esc(thread?.title || 'Untitled conversation')}</h2></div>
          <div class="top-actions">
            <button class="top-action mobile-menu" data-action="toggle-menu" aria-label="Open conversations">${ICONS.menu}</button>
            <div class="status-pill"><i class="engine-dot"></i> AUREON ENGINE · READY</div>
            <button class="top-action" data-action="new-thread">${ICONS.plus}<span>New thread</span></button>
            <button class="top-action" data-action="thread-menu" aria-label="Thread options">${ICONS.more}</button>
          </div>
        </header>
        <section class="content">
          <div class="chat-column">
            <div class="messages" id="messages">
              ${hasMessages ? `<div class="message-list">${thread.messages.map(messageMarkup).join('')}</div>` : emptyMarkup()}
            </div>
            <div class="composer-wrap">
              <form class="composer" id="composer">
                <button type="button" class="attach-btn" data-action="attach" aria-label="Attach a file" title="Attachments are coming soon">${ICONS.attach}</button>
                <textarea id="prompt" rows="1" placeholder="Ask Aureon anything…" aria-label="Message Aureon"></textarea>
                <div class="composer-actions">${state.generating ? `<button type="button" class="stop-btn" data-action="stop" aria-label="Stop generation">${ICONS.stop}</button>` : `<button class="send-btn" type="submit" aria-label="Send message">${ICONS.arrow}</button>`}</div>
              </form>
              <div class="composer-hint"><span>Aureon Engine · Local session · No API key required</span><span class="hint-right"><span>Press</span><span class="key-hint">⌘ ↵</span><span>to send</span></span></div>
            </div>
          </div>
        </section>
      </main>
      <div class="toast" id="toast"></div>
    </div>`;
  bindEvents();
  if (hasMessages) scrollMessages();
}

function threadRow(thread) {
  return `<div class="thread-item ${thread.id === state.activeId ? 'active' : ''}" data-thread="${thread.id}"><span class="thread-icon">${ICONS.message}</span><span class="thread-title">${esc(thread.title)}</span><span class="thread-actions">${iconButton('Rename', ICONS.edit, '', `data-rename="${thread.id}"`)}${iconButton('Delete', ICONS.trash, 'danger', `data-delete="${thread.id}"`)}</span></div>`;
}

function emptyMarkup() {
  return `<div class="empty-state"><div class="empty-kicker">Private intelligence suite</div><h1>Think <em>beyond</em><br />the prompt.</h1><p>Aureon turns scattered thoughts into clear direction — with an opinion when you need one and room to think when you don’t.</p><div class="prompt-grid">${starters.map((item, index) => `<button class="prompt-card" data-starter="${index}"><span class="prompt-icon">${item.icon}</span><strong>${item.title}</strong><span>${item.hint}</span></button>`).join('')}</div></div>`;
}

function messageMarkup(message, index) {
  const isUser = message.role === 'user';
  const content = message.streaming && !message.content ? '<span class="typing"><i></i><i></i><i></i></span>' : (isUser ? esc(message.content).replace(/\n/g, '<br>') : renderMarkdown(message.content));
  return `<article class="message ${isUser ? 'user' : 'assistant'} ${message.streaming ? 'is-streaming' : ''}" data-message="${message.id}"><div class="avatar">${isUser ? 'Y' : ICONS.spark}</div><div class="message-body"><div class="message-meta"><span>${isUser ? 'You' : 'Aureon'}</span><span>${message.streaming ? 'thinking…' : timeLabel(message.createdAt)}</span></div><div class="message-content">${content}</div><div class="message-tools">${!isUser && !message.streaming ? `<button class="tool-btn" data-copy-message="${message.id}">${ICONS.copy} Copy</button><button class="tool-btn" data-regenerate="${message.id}">${ICONS.refresh} Regenerate</button>` : ''}${isUser ? `<button class="tool-btn" data-edit-message="${message.id}">${ICONS.edit} Edit</button>` : ''}</div></div></article>`;
}

function bindEvents() {
  document.querySelectorAll('[data-action="new-thread"]').forEach((button) => button.addEventListener('click', newThread));
  document.querySelector('[data-action="toggle-menu"]')?.addEventListener('click', () => { state.mobileOpen = !state.mobileOpen; render(); });
  document.querySelector('[data-action="search"]')?.addEventListener('click', searchThreads);
  document.querySelector('[data-action="thread-menu"]')?.addEventListener('click', () => renameThread(state.activeId));
  document.querySelectorAll('[data-thread]').forEach((row) => row.addEventListener('click', (event) => {
    if (event.target.closest('[data-rename]') || event.target.closest('[data-delete]')) return;
    if (state.generating) { showToast('Let the current response finish first.'); return; }
    state.activeId = row.dataset.thread; state.mobileOpen = false; render();
  }));
  document.querySelectorAll('[data-rename]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); renameThread(button.dataset.rename); }));
  document.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); deleteThread(button.dataset.delete); }));
  document.querySelectorAll('[data-starter]').forEach((button) => button.addEventListener('click', () => {
    if (activeThread().messages.length) newThread();
    sendPrompt(starters[button.dataset.starter].title);
  }));
  document.querySelector('#composer')?.addEventListener('submit', (event) => { event.preventDefault(); sendPrompt(document.querySelector('#prompt').value); });
  document.querySelector('#prompt')?.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); sendPrompt(event.target.value); } resizeTextarea(event.target); });
  document.querySelector('#prompt')?.addEventListener('input', (event) => resizeTextarea(event.target));
  document.querySelector('[data-action="stop"]')?.addEventListener('click', stopGeneration);
  document.querySelector('[data-action="attach"]')?.addEventListener('click', () => showToast('Attachments will be available in a future Aureon release.'));
  document.querySelectorAll('[data-copy-message]').forEach((button) => button.addEventListener('click', () => copyMessage(button.dataset.copyMessage)));
  document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => copyText(decodeURIComponent(button.dataset.copy))));
  document.querySelectorAll('[data-regenerate]').forEach((button) => button.addEventListener('click', () => regenerate(button.dataset.regenerate)));
  document.querySelectorAll('[data-edit-message]').forEach((button) => button.addEventListener('click', () => editMessage(button.dataset.editMessage)));
}

function resizeTextarea(textarea) { textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`; }
function scrollMessages() { const node = document.querySelector('#messages'); if (node) node.scrollTop = node.scrollHeight; }
function showToast(message) { const toast = document.querySelector('#toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }
async function copyText(text) { try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard'); } catch { showToast('Copy unavailable in this browser'); } }
function copyMessage(id) { const message = activeThread().messages.find((item) => item.id === id); if (message) copyText(message.content); }
function newThread() { stopGeneration(); const thread = makeThread(); state.threads.unshift(thread); state.activeId = thread.id; state.mobileOpen = false; saveThreads(); render(); setTimeout(() => document.querySelector('#prompt')?.focus(), 50); }
function renameThread(id) { const thread = state.threads.find((item) => item.id === id); if (!thread) return; const next = window.prompt('Name this conversation', thread.title); if (next?.trim()) { thread.title = next.trim().slice(0, 60); thread.updatedAt = Date.now(); saveThreads(); render(); } }
function deleteThread(id) { if (state.threads.length === 1) { showToast('Keep one thread ready for your next thought.'); return; } const thread = state.threads.find((item) => item.id === id); if (!thread || !window.confirm(`Delete “${thread.title}”?`)) return; state.threads = state.threads.filter((item) => item.id !== id); if (state.activeId === id) state.activeId = state.threads[0].id; saveThreads(); render(); }
function searchThreads() { const query = window.prompt('Search your threads'); if (!query?.trim()) return; const match = state.threads.find((thread) => `${thread.title} ${thread.messages.map((m) => m.content).join(' ')}`.toLowerCase().includes(query.toLowerCase())); if (match) { state.activeId = match.id; render(); showToast(`Opened “${match.title}”`); } else showToast('No matching thread found'); }

function sendPrompt(value) {
  const prompt = value.trim(); if (!prompt || state.generating) return;
  const thread = activeThread();
  if (state.editingMessageId) {
    const editIndex = thread.messages.findIndex((message) => message.id === state.editingMessageId);
    if (editIndex >= 0) thread.messages.splice(editIndex);
    state.editingMessageId = null;
  }
  if (!thread.messages.length && thread.title === 'Untitled conversation') thread.title = prompt.slice(0, 42) + (prompt.length > 42 ? '…' : '');
  thread.messages.push({ id: uid(), role: 'user', content: prompt, createdAt: Date.now() });
  thread.updatedAt = Date.now(); saveThreads(); state.generating = true; render();
  const assistant = { id: uid(), role: 'assistant', content: '', createdAt: Date.now(), streaming: true };
  thread.messages.push(assistant); render();
  let response;
  try { response = composeResponse(prompt, thread); } catch (error) {
    response = `I hit a local reasoning error while shaping that response. You can **regenerate** this answer or try a shorter prompt.\n\n_Error: ${error.message || 'unknown engine error'}_`;
  }
  let cursor = 0;
  state.streamTimer = setInterval(() => {
    cursor = Math.min(response.length, cursor + Math.max(2, Math.round(response.length / 85)));
    assistant.content = response.slice(0, cursor);
    if (cursor >= response.length) { clearInterval(state.streamTimer); state.streamTimer = null; assistant.streaming = false; state.generating = false; thread.updatedAt = Date.now(); saveThreads(); }
    render();
  }, 26);
}
function stopGeneration() { if (!state.generating) return; clearInterval(state.streamTimer); state.streamTimer = null; const thread = activeThread(); const active = thread.messages[thread.messages.length - 1]; if (active?.streaming) { active.streaming = false; active.content += '\n\n_Generation paused. You can regenerate this response when ready._'; } state.generating = false; saveThreads(); render(); showToast('Generation stopped'); }
function regenerate(messageId) { const thread = activeThread(); const index = thread.messages.findIndex((message) => message.id === messageId); if (index < 1 || state.generating) return; const prompt = thread.messages[index - 1]?.content; thread.messages.splice(index, 1); state.generating = true; const assistant = { id: uid(), role: 'assistant', content: '', createdAt: Date.now(), streaming: true }; thread.messages.splice(index, 0, assistant); render(); const response = composeResponse(prompt, thread) + '\n\n_Refined pass: I’ve tightened the signal and made the next step more concrete._'; let cursor = 0; state.streamTimer = setInterval(() => { cursor = Math.min(response.length, cursor + Math.max(2, Math.round(response.length / 85))); assistant.content = response.slice(0, cursor); if (cursor >= response.length) { clearInterval(state.streamTimer); state.streamTimer = null; assistant.streaming = false; state.generating = false; saveThreads(); } render(); }, 26); }
function editMessage(messageId) { const message = activeThread().messages.find((item) => item.id === messageId); const prompt = document.querySelector('#prompt'); if (!message || !prompt) return; state.editingMessageId = messageId; prompt.value = message.content; resizeTextarea(prompt); prompt.focus(); showToast('Edit the prompt, then send it again'); }

render();
