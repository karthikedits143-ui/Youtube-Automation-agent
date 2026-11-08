const STORAGE_KEY = 'tubeflow-projects-v1';
const form = document.querySelector('#briefForm');
const results = document.querySelector('#results');
const toast = document.querySelector('#toast');
let projects = loadProjects();
let toastTimer;

function loadProjects() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function saveProjects() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); updateCount(); }
  catch { showToast('Could not save. Your browser storage may be full.'); }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function titleCase(text) { return text.trim().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, char => char.toUpperCase()); }
function words(text) { return text.trim().split(/\s+/).filter(Boolean); }
function makePlan(brief) {
  const topic = brief.topic.trim().replace(/[.!?]+$/, '');
  const audience = brief.audience || 'anyone interested in this topic';
  const niche = brief.niche || 'your niche';
  const short = brief.duration === 'short';
  const minutes = short ? 1 : Number(brief.duration);
  const sections = short
    ? [
      ['0–3 sec · Hook', `Start with a curiosity gap: “Here’s one thing about ${topic} most people miss.”`],
      ['3–45 sec · Value', `Share one useful, specific takeaway about ${topic}. Explain it simply for ${audience}, and show an example.`],
      ['45–60 sec · Close', 'Recap the takeaway in one sentence. Invite viewers to comment with their experience.']
    ]
    : [
      ['0:00 · Hook', `Open with the result or surprising question: “Want to know how ${topic} can make a difference?” Promise a clear takeaway.`],
      ['0:20 · Intro', `Introduce yourself briefly and explain who this video is for: ${audience}. Preview the three things viewers will learn.`],
      ['1:00 · Context', `Set the scene for ${topic}. Share why it matters to people interested in ${niche}, and establish what viewers need to know first.`],
      ['2:30 · Main point one', `Explain the first key idea about ${topic}. Give a concrete example and keep jargon easy to follow.`],
      ['4:30 · Main point two', 'Build on the first idea with a practical tip, demonstration, or step-by-step explanation.'],
      ['6:30 · Main point three', 'Share a common mistake or misconception, then explain a better approach viewers can try.'],
      ['8:30 · Recap', 'Summarize the most useful takeaways. Give viewers one specific next step they can use today.'],
      ['Final 20 sec · Call to action', 'Ask one natural question to encourage comments. Invite viewers to subscribe if they want more videos like this.']
    ];
  const titleTopic = titleCase(topic);
  const titles = [
    `${titleTopic}: A Simple Guide for Beginners`,
    `How to ${titleTopic} (What I Wish I Knew First)`,
    `${titleTopic} — ${short ? 'One Tip That Makes a Difference' : `${minutes}-Minute Guide`}`
  ];
  const tags = [...new Set([...words(niche), ...words(topic), 'beginners', 'how to', 'tips'].map(t => t.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim()).filter(Boolean))].slice(0, 12);
  const description = `In this video, we explore ${topic}. Whether you're new to ${niche} or looking for practical ideas, this guide is made for ${audience}.\n\nIn this video:\n• The key things to know about ${topic}\n• Practical examples and tips\n• A simple next step to try\n\nWhat would you like to learn next? Share your thoughts in the comments.\n\n#${tags.slice(0, 3).map(t => t.replace(/\s+/g, '')).join(' #')}`;
  const durationText = short ? 'under 60 seconds' : `about ${minutes} minutes`;
  const script = sections.map(([heading, body]) => `## ${heading}\n${body}`).join('\n\n');
  return { ...brief, titles, description, tags, script, durationText, thumbnail: `Show a clear, expressive subject related to “${topic}” against a simple, high-contrast background. Use a close-up composition, one focal point, and 2–4 readable words. Keep the design uncluttered and make sure it accurately represents the video.` };
}
function renderPlan(plan) {
  results.classList.remove('empty-state');
  results.innerHTML = `<div class="result-top"><div><div class="eyebrow">YOUR VIDEO PLAN</div><h2>${escapeHTML(titleCase(plan.topic))}</h2><p>Ready to shape into your next ${escapeHTML(plan.durationText)} video.</p></div><div class="result-actions"><button id="savePlan" class="button button-primary button-small" type="button">Save project</button><button id="downloadPlan" class="button button-quiet button-small" type="button">↓ Download</button></div></div>
    <div class="result-tabs" role="tablist"><button class="result-tab active" data-tab="outline" role="tab" aria-selected="true">Script outline</button><button class="result-tab" data-tab="titles" role="tab" aria-selected="false">Titles & SEO</button><button class="result-tab" data-tab="thumbnail" role="tab" aria-selected="false">Thumbnail</button></div><div id="tabContent" class="tab-content"></div>`;
  const content = results.querySelector('#tabContent');
  const showTab = tab => {
    results.querySelectorAll('.result-tab').forEach(button => { const active = button.dataset.tab === tab; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    if (tab === 'outline') content.innerHTML = `<div class="outline-meta">${escapeHTML(plan.tone)} tone <span>·</span> ${escapeHTML(plan.durationText)}</div><div class="script-outline">${plan.script.split('\n\n').map(part => { const [heading, ...body] = part.split('\n'); return `<article><h3>${escapeHTML(heading.replace(/^## /,''))}</h3><p>${escapeHTML(body.join(' '))}</p></article>`; }).join('')}</div>`;
    if (tab === 'titles') content.innerHTML = `<h3 class="content-label">TITLE IDEAS</h3><ol class="title-list">${plan.titles.map(title => `<li>${escapeHTML(title)}</li>`).join('')}</ol><h3 class="content-label">VIDEO DESCRIPTION</h3><pre class="description-box">${escapeHTML(plan.description)}</pre><h3 class="content-label">SUGGESTED TAGS</h3><div class="tags">${plan.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div><p class="tip">Tip: Choose an accurate title and verify relevant search terms with your own audience research. Suggestions are not a guarantee of ranking or views.</p>`;
    if (tab === 'thumbnail') content.innerHTML = `<h3 class="content-label">THUMBNAIL CONCEPT</h3><div class="thumbnail-prompt">${escapeHTML(plan.thumbnail)}</div><p class="tip">Keep thumbnails honest and consistent with what the video actually delivers.</p>`;
  };
  results.querySelectorAll('.result-tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  showTab('outline');
  results.querySelector('#savePlan').addEventListener('click', () => {
    const project = { ...plan, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, savedAt: new Date().toISOString() };
    projects.unshift(project); saveProjects(); showToast('Video plan saved on this device.');
  });
  results.querySelector('#downloadPlan').addEventListener('click', () => downloadPlan(plan));
}
function downloadPlan(plan) {
  const markdown = `# ${titleCase(plan.topic)}\n\n**Niche:** ${plan.niche || 'Not specified'}  \n**Audience:** ${plan.audience || 'Not specified'}  \n**Tone:** ${plan.tone}  \n**Target length:** ${plan.durationText}\n\n## Script outline\n\n${plan.script}\n\n## Title ideas\n\n${plan.titles.map((title, i) => `${i+1}. ${title}`).join('\n')}\n\n## Video description\n\n${plan.description}\n\n## Suggested tags\n\n${plan.tags.join(', ')}\n\n## Thumbnail concept\n\n${plan.thumbnail}\n`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `${plan.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'youtube-video-plan'}.md`;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url); showToast('Your video plan has been downloaded.');
}
function showToast(message) { toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800); }
function updateCount() { document.querySelector('#projectCount').textContent = projects.length; }
function openStudio() { document.querySelector('#studioView').classList.remove('hidden'); document.querySelector('#projectsView').classList.add('hidden'); document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'studio')); }
function renderProjects() {
  const list = document.querySelector('#projectList'); updateCount();
  if (!projects.length) { list.innerHTML = `<div class="card projects-empty"><div class="empty-illustration">▤</div><h2>No saved projects yet</h2><p>Generate a video plan and save it to find it here later.</p><button class="button button-primary" id="startPlanning" type="button">Create your first plan</button></div>`; list.querySelector('#startPlanning').addEventListener('click', openStudio); return; }
  list.innerHTML = projects.map(project => `<article class="card project-card"><div><div class="project-date">SAVED ${new Date(project.savedAt).toLocaleDateString()}</div><h2>${escapeHTML(titleCase(project.topic))}</h2><p>${escapeHTML(project.niche || 'No niche')} · ${escapeHTML(project.durationText)}</p></div><div class="project-actions"><button class="button button-quiet button-small" data-open="${escapeHTML(project.id)}" type="button">Open</button><button class="icon-button" data-delete="${escapeHTML(project.id)}" aria-label="Delete ${escapeHTML(project.topic)}" type="button">×</button></div></article>`).join('');
  list.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => { const project = projects.find(item => item.id === button.dataset.open); if (project) { openStudio(); renderPlan(project); window.scrollTo({ top: 0, behavior: 'smooth' }); } }));
  list.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => { projects = projects.filter(item => item.id !== button.dataset.delete); saveProjects(); renderProjects(); showToast('Project deleted.'); }));
}
form.addEventListener('submit', event => { event.preventDefault(); const brief = { topic: document.querySelector('#topic').value, niche: document.querySelector('#niche').value.trim(), audience: document.querySelector('#audience').value.trim(), tone: document.querySelector('#tone').value, duration: document.querySelector('#duration').value }; renderPlan(makePlan(brief)); });
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => { const projectsView = item.dataset.view === 'projects'; document.querySelector('#studioView').classList.toggle('hidden', projectsView); document.querySelector('#projectsView').classList.toggle('hidden', !projectsView); document.querySelectorAll('.nav-item').forEach(nav => nav.classList.toggle('active', nav === item)); if (projectsView) renderProjects(); }));
for (const id of ['newProject', 'newProjectTop']) document.querySelector(`#${id}`).addEventListener('click', () => { openStudio(); form.reset(); document.querySelector('#topic').focus(); });
updateCount();
