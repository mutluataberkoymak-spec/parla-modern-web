const toast = document.querySelector('#toast');
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function slugify(value) {
  return String(value || 'portfoy')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'portfoy';
}

document.querySelector('#menuBtn')?.addEventListener('click', () => document.querySelector('#mainNav')?.classList.toggle('open'));
document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => document.querySelector('#mainNav')?.classList.remove('open')));

document.querySelector('[data-search-jump]')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const q = new URLSearchParams({ type: fd.get('type') || 'Hepsi', category: fd.get('category') || 'Hepsi', q: fd.get('q') || '' });
  location.href = 'ilanlar.html?' + q.toString();
});

const grid = document.querySelector('#propertyGrid');
const search = document.querySelector('#propertySearch');
let activeType = 'Hepsi';
function applyFilters() {
  if (!grid) return;
  const q = (search?.value || new URLSearchParams(location.search).get('q') || '').toLowerCase();
  let visible = 0;
  document.querySelectorAll('.property-card').forEach(card => {
    const typeOk = activeType === 'Hepsi' || card.dataset.type === activeType;
    const text = [card.dataset.title, card.dataset.location, card.dataset.category, card.dataset.type].join(' ');
    const show = typeOk && text.includes(q);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const empty = document.querySelector('#emptyState');
  if (empty) empty.hidden = visible !== 0;
}
if (search) {
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  const t = params.get('type');
  if (t) {
    activeType = t;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.dataset.filterType === t));
  }
  applyFilters();
  search.addEventListener('input', applyFilters);
}
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeType = btn.dataset.filterType;
  applyFilters();
  showToast(`${activeType} portföyleri filtrelendi.`);
}));

document.querySelector('#contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  showToast('Talep alındı. Bu prototipte mesaj gönderimi demo olarak gösterildi.');
  e.currentTarget.reset();
});

const listingForm = document.querySelector('#listingForm');
const photoInput = document.querySelector('#photoInput');
const photoPreviewGrid = document.querySelector('#photoPreviewGrid');
const photoCount = document.querySelector('#photoCount');
const portfolioSummary = document.querySelector('#portfolioSummary');
let selectedPhotos = [];

function getCheckedValues(form, name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function renderPhotoPreviews() {
  if (!photoPreviewGrid || !photoCount) return;
  photoPreviewGrid.innerHTML = '';
  selectedPhotos.slice(0, 35).forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const item = document.createElement('div');
    item.className = 'photo-thumb';
    item.innerHTML = `<img src="${url}" alt="Fotoğraf ${index + 1}"><span>${index + 1}</span>`;
    photoPreviewGrid.appendChild(item);
  });
  photoCount.textContent = `${selectedPhotos.length} / 35`;
}

photoInput?.addEventListener('change', event => {
  selectedPhotos = [...event.target.files].slice(0, 35);
  renderPhotoPreviews();
  showToast(`${selectedPhotos.length} fotoğraf eklendi.`);
});

function buildPortfolioData(form) {
  const fd = new FormData(form);
  const get = name => String(fd.get(name) || '').trim();
  const title = get('title') || `${get('district') || 'Akçay'} ${get('rooms') || ''} ${get('housingType') || 'Portföy'}`.trim() || 'Yeni Konutta.com Portföyü';
  const category = get('category') || getCheckedValues(form, 'housingType')[0] || 'Konut';
  const type = get('type') || 'Satılık';
  const location = [get('city'), get('district'), get('neighborhood')].filter(Boolean).join(' / ') || 'Balıkesir / Edremit / Akçay';
  return {
    id: `PRL-${Date.now()}`,
    title,
    category,
    type,
    price: get('price') || 'Fiyat belirtilmedi',
    location,
    sqm: get('grossSqm') ? `${get('grossSqm')} m²` : (get('netSqm') ? `${get('netSqm')} m² net` : 'm² belirtilmedi'),
    rooms: get('rooms') || 'Oda belirtilmedi',
    floor: get('floor'),
    heating: get('heating'),
    bathrooms: get('bathrooms'),
    openAreaSqm: get('openAreaSqm'),
    titleDeedStatus: get('titleDeedStatus'),
    propertyNumber: get('propertyNumber'),
    description: get('description') || 'Konutta.com güvencesiyle detaylı portföy formundan oluşturulan yeni portföy.',
    advisor: get('consultantName') || get('advisor') || 'Konutta.com Ofis Ekibi',
    phone: get('consultantPhone'),
    photos: selectedPhotos.map(file => ({ name: file.name, url: URL.createObjectURL(file) })),
    features: {
      interior: getCheckedValues(form, 'interiorFeatures'),
      exterior: getCheckedValues(form, 'exteriorFeatures'),
      neighborhood: getCheckedValues(form, 'neighborhoodFeatures'),
      transport: getCheckedValues(form, 'transportFeatures'),
      view: getCheckedValues(form, 'viewFeatures'),
      housingType: getCheckedValues(form, 'housingType'),
      fronts: getCheckedValues(form, 'fronts'),
      deedType: getCheckedValues(form, 'deedType'),
    },
    address: {
      street: get('street'), buildingNo: get('buildingNo'), apartmentNo: get('apartmentNo')
    },
    deed: {
      blockNo: get('blockNo'), parcelNo: get('parcelNo'), sheetNo: get('sheetNo'), deedArea: get('deedArea'), landShare: get('landShare'), volumeNo: get('volumeNo'), pageNo: get('pageNo')
    }
  };
}

function renderPortfolio(portfolio) {
  const wrap = document.querySelector('#panelPreview');
  if (!wrap) return;
  const image = portfolio.photos[0]?.url || 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80';
  wrap.innerHTML = '';
  const article = document.createElement('article');
  article.className = 'property-card created-portfolio-card';
  article.dataset.type = portfolio.type;
  article.dataset.category = portfolio.category;
  article.dataset.location = portfolio.location.toLowerCase();
  article.dataset.title = portfolio.title.toLowerCase();
  article.innerHTML = `<a class="card-link" href="#portfolioSummary"><img src="${image}" alt="${escapeHtml(portfolio.title)}"><div class="property-body"><div class="meta"><span>${escapeHtml(portfolio.type)} ${escapeHtml(portfolio.category)}</span><span>${portfolio.photos.length} fotoğraf</span></div><h3>${escapeHtml(portfolio.title)}</h3><p>${escapeHtml(portfolio.location)} · ${escapeHtml(portfolio.rooms)} · ${escapeHtml(portfolio.sqm)}</p><div class="card-bottom"><strong>${escapeHtml(portfolio.price)}</strong><span class="detail-link">Detay hazır →</span></div></div></a>`;
  wrap.prepend(article);

  const featureLine = [portfolio.features.interior, portfolio.features.exterior, portfolio.features.neighborhood, portfolio.features.transport, portfolio.features.view]
    .flat().slice(0, 18);
  if (portfolioSummary) {
    portfolioSummary.classList.remove('empty');
    portfolioSummary.innerHTML = `
      <div class="summary-head"><strong>${escapeHtml(portfolio.id)}</strong><span>${escapeHtml(portfolio.advisor)}</span></div>
      <h3>${escapeHtml(portfolio.title)}</h3>
      <p>${escapeHtml(portfolio.description)}</p>
      <dl>
        <div><dt>Fiyat</dt><dd>${escapeHtml(portfolio.price)}</dd></div>
        <div><dt>Konum</dt><dd>${escapeHtml(portfolio.location)}</dd></div>
        <div><dt>m²</dt><dd>${escapeHtml(portfolio.sqm)}</dd></div>
        <div><dt>Oda</dt><dd>${escapeHtml(portfolio.rooms)}</dd></div>
        <div><dt>Tapu</dt><dd>${escapeHtml(portfolio.titleDeedStatus || portfolio.features.deedType.join(', ') || 'Belirtilmedi')}</dd></div>
        <div><dt>Taşınmaz No</dt><dd>${escapeHtml(portfolio.propertyNumber || 'Belirtilmedi')}</dd></div>
      </dl>
      <div class="summary-tags">${featureLine.map(f => `<span>${escapeHtml(f)}</span>`).join('') || '<span>Özellik seçilmedi</span>'}</div>
    `;
  }
  localStorage.setItem('parla:lastPortfolio', JSON.stringify({ ...portfolio, photos: portfolio.photos.map(p => ({ name: p.name })) }));
  const savedPortfolio = { ...portfolio, photos: portfolio.photos.map(p => ({ name: p.name })) };
  const portfolios = readJson('parla:portfolios', []);
  const withoutSame = portfolios.filter(item => item.id !== savedPortfolio.id);
  writeJson('parla:portfolios', [savedPortfolio, ...withoutSame]);
  renderPortfolioManager();
}

listingForm?.addEventListener('submit', e => {
  e.preventDefault();
  const portfolio = buildPortfolioData(e.currentTarget);
  renderPortfolio(portfolio);
  showToast('Portföy oluşturuldu ve canlı önizlemeye eklendi.');
});

document.querySelector('#fillPortfolioSampleBtn')?.addEventListener('click', () => {
  if (!listingForm) return;
  const set = (name, value) => { const el = listingForm.elements[name]; if (el && 'value' in el) el.value = value; };
  set('formDate', new Date().toISOString().slice(0, 10));
  set('advisor', 'Açane Saydıran');
  set('portfolioNo', 'PRL-0001');
  set('listingNo', '1234567890');
  set('price', '15.999.000 TL');
  set('grossSqm', '351');
  set('netSqm', '225');
  set('openAreaSqm', '261');
  set('rooms', '3+1');
  set('buildingAge', '2');
  set('floorCount', '3');
  set('floor', '1');
  set('heating', 'Doğalgaz Kombi');
  set('bathrooms', '2');
  set('kitchen', 'Ankastre');
  set('parking', 'Kapalı Otopark');
  set('usageStatus', 'Boş');
  set('dues', '750');
  set('city', 'Balıkesir');
  set('district', 'Edremit');
  set('neighborhood', 'Altınkum');
  set('street', 'Hakimiyet Caddesi');
  set('buildingNo', '54/B');
  set('apartmentNo', '5');
  set('blockNo', '123');
  set('parcelNo', '45');
  set('titleDeedStatus', 'Kat Mülkiyeti');
  set('propertyNumber', '70596688');
  set('description', 'Konutta.com güvencesiyle; denize yakın, geniş açık alanlı, modern kullanıma sahip, krediye uygun ve yatırım değeri yüksek özel portföy. Detaylı bilgi ve yer gösterimi için danışmanımızla iletişime geçebilirsiniz.');
  set('officeName', 'Konutta.com');
  set('consultantName', 'Açane Saydıran');
  set('consultantEmail', 'ornek@mail.com');
  set('authorizationNo', '1001719');
  set('consultantPhone', '0531 736 64 00');
  ['Klima', 'Kombi', 'Çelik Kapı', 'Fiber İnternet', 'Spot Aydınlatma', 'Kapalı Otopark', 'Kamera Sistemi', 'Denize Sıfır', 'Market', 'Sahil', 'Deniz', 'Daire'].forEach(value => {
    const input = [...listingForm.querySelectorAll('input[type="checkbox"]')].find(i => i.value === value);
    if (input) input.checked = true;
  });
  showToast('Örnek portföy formu dolduruldu. Fotoğraf ekleyip portföyü oluşturabilirsin.');
});


// Demo auth, member favorites and admin content/theme controls
const DEMO_USERS_KEY = 'parla:users';
const DEMO_SESSION_KEY = 'parla:session';
const DEMO_FAVORITES_KEY = 'parla:favorites';
const DEMO_APPOINTMENTS_KEY = 'parla:appointments';
const DEFAULT_ADMIN = { username: 'admin', password: '123', role: 'admin', fullName: 'Konutta.com Yönetici' };

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getUsers() {
  const users = readJson(DEMO_USERS_KEY, []);
  if (!users.some(u => u.username === 'admin')) users.unshift(DEFAULT_ADMIN);
  return users;
}
function setSession(user) { writeJson(DEMO_SESSION_KEY, { username: user.username, role: user.role, fullName: user.fullName || user.username, phone: user.phone || '' }); }
function getSession() { return readJson(DEMO_SESSION_KEY, null); }
function clearSession() { localStorage.removeItem(DEMO_SESSION_KEY); }

function showAuthTab(tab) {
  document.querySelectorAll('[data-auth-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === tab));
  const login = document.querySelector('#loginForm');
  const register = document.querySelector('#registerForm');
  if (login) login.hidden = tab !== 'login';
  if (register) register.hidden = tab !== 'register';
}
document.querySelectorAll('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => showAuthTab(btn.dataset.authTab)));

document.querySelector('#loginForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const username = String(fd.get('username') || '').trim();
  const password = String(fd.get('password') || '').trim();
  const user = getUsers().find(u => u.username === username && u.password === password);
  if (!user) { showToast('Kullanıcı adı veya şifre hatalı.'); return; }
  setSession(user);
  renderRolePanels();
  showToast(user.role === 'admin' ? 'Yönetici paneli açıldı.' : 'Üye paneli açıldı.');
});

document.querySelector('#registerForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const user = {
    username: String(fd.get('username') || '').trim(),
    password: String(fd.get('password') || '').trim(),
    fullName: String(fd.get('fullName') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    role: 'member',
  };
  if (!user.username || !user.password) { showToast('Kullanıcı adı ve şifre zorunlu.'); return; }
  const users = getUsers();
  if (users.some(u => u.username === user.username)) { showToast('Bu kullanıcı adı zaten var.'); return; }
  users.push(user);
  writeJson(DEMO_USERS_KEY, users.filter(u => u.username !== 'admin'));
  setSession(user);
  renderRolePanels();
  showToast('Üyelik oluşturuldu. Üye paneli açıldı.');
});

document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => {
  clearSession();
  renderRolePanels();
  showToast('Çıkış yapıldı.');
}));

function renderRolePanels() {
  const session = getSession();
  const authHero = document.querySelector('#authHero');
  const adminPanel = document.querySelector('#adminPanel');
  const userPanel = document.querySelector('#userPanel');
  if (authHero) authHero.hidden = !!session;
  if (adminPanel) adminPanel.hidden = !(session?.role === 'admin');
  if (userPanel) userPanel.hidden = !(session?.role === 'member');
  if (session?.role === 'admin') showAdminSection('portfolioFormPanel', false);
  renderFavoritesList();
  renderAppointments();
}

function showAdminSection(id, announce = true) {
  document.querySelectorAll('.admin-section').forEach(section => section.hidden = section.id !== id);
  document.querySelectorAll('[data-admin-section]').forEach(btn => btn.classList.toggle('active', btn.dataset.adminSection === id));
  if (announce) showToast(`${document.querySelector(`[data-admin-section="${id}"] strong`)?.textContent || 'Bölüm'} açıldı.`);
}
document.querySelectorAll('[data-admin-section]').forEach(btn => btn.addEventListener('click', () => showAdminSection(btn.dataset.adminSection)));

function getPropertyIdentity(card) {
  return {
    id: slugify(card.dataset.title || card.querySelector('h3')?.textContent || 'portfoy'),
    title: card.querySelector('h3')?.textContent?.trim() || 'Portföy',
    meta: card.querySelector('p')?.textContent?.trim() || '',
    price: card.querySelector('.card-bottom strong')?.textContent?.trim() || '',
    href: card.querySelector('a')?.getAttribute('href') || 'gayrimenkuller.html',
  };
}
function getFavorites() { return readJson(DEMO_FAVORITES_KEY, []); }
function setFavorites(items) { writeJson(DEMO_FAVORITES_KEY, items); }
function injectFavoriteButtons() {
  const cards = document.querySelectorAll('.property-card');
  const favs = getFavorites();
  cards.forEach(card => {
    if (card.querySelector('.favorite-btn')) return;
    const data = getPropertyIdentity(card);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'favorite-btn';
    btn.setAttribute('aria-label', `${data.title} favorilere ekle`);
    btn.textContent = favs.some(f => f.id === data.id) ? '♥' : '♡';
    btn.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      const session = getSession();
      if (!session || session.role !== 'member') { showToast('Favori eklemek için üye girişi yapmalısın.'); location.href = 'panel.html'; return; }
      const current = getFavorites();
      const exists = current.some(f => f.id === data.id);
      const next = exists ? current.filter(f => f.id !== data.id) : [data, ...current];
      setFavorites(next);
      btn.textContent = exists ? '♡' : '♥';
      renderFavoritesList();
      showToast(exists ? 'Favorilerden çıkarıldı.' : 'Favorilere eklendi.');
    });
    card.appendChild(btn);
  });
}

function renderFavoritesList() {
  const list = document.querySelector('#favoritesList');
  if (!list) return;
  const favs = getFavorites();
  list.innerHTML = favs.length ? favs.map(f => `<a class="favorite-item" href="${escapeHtml(f.href)}"><strong>${escapeHtml(f.title)}</strong><span>${escapeHtml(f.meta)}</span><em>${escapeHtml(f.price)}</em></a>`).join('') : '<p class="muted">Henüz favori portföy yok.</p>';
}

document.querySelector('#appointmentForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const session = getSession();
  if (!session || session.role !== 'member') { showToast('Randevu için üye girişi gerekir.'); return; }
  const fd = new FormData(e.currentTarget);
  const appt = { id: `RND-${Date.now()}`, username: session.username, fullName: session.fullName, phone: session.phone, topic: String(fd.get('topic') || ''), date: String(fd.get('date') || ''), time: String(fd.get('time') || ''), note: String(fd.get('note') || ''), status: 'Yeni' };
  const appointments = readJson(DEMO_APPOINTMENTS_KEY, []);
  appointments.unshift(appt);
  writeJson(DEMO_APPOINTMENTS_KEY, appointments);
  e.currentTarget.reset();
  renderAppointments();
  showToast('Randevu talebi oluşturuldu.');
});

function renderAppointments() {
  const appointments = readJson(DEMO_APPOINTMENTS_KEY, []);
  const session = getSession();
  const userList = document.querySelector('#userAppointmentsList');
  const adminList = document.querySelector('#adminAppointmentsList');
  const render = items => items.length ? items.map(a => `<article class="appointment-item"><strong>${escapeHtml(a.topic)}</strong><span>${escapeHtml(a.date)} ${escapeHtml(a.time)} · ${escapeHtml(a.status)}</span><small>${escapeHtml(a.fullName || a.username)} ${a.phone ? '· '+escapeHtml(a.phone) : ''}</small><p>${escapeHtml(a.note || '')}</p></article>`).join('') : '<p class="muted">Henüz randevu yok.</p>';
  if (userList) userList.innerHTML = render(appointments.filter(a => a.username === session?.username));
  if (adminList) adminList.innerHTML = render(appointments);
}

document.querySelector('#siteContentForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  writeJson('parla:siteContent', data);
  const preview = document.querySelector('#contentPreview');
  if (preview) preview.innerHTML = `<strong>${escapeHtml(data.siteTitle)}</strong><h3>${escapeHtml(data.heroTitle)}</h3><p>${escapeHtml(data.heroText)}</p><small>${escapeHtml(data.region)} · ${escapeHtml(data.phone)}</small>`;
  showToast('Site içeriği kaydedildi.');
});

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.navy) root.style.setProperty('--navy', theme.navy);
  if (theme.blue) root.style.setProperty('--blue', theme.blue);
  if (theme.cyan) root.style.setProperty('--cyan', theme.cyan);
  if (theme.bg) root.style.setProperty('--bg', theme.bg);
}
document.querySelector('#themeForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const theme = Object.fromEntries(new FormData(e.currentTarget));
  writeJson('parla:theme', theme);
  applyTheme(theme);
  showToast('Tema ayarları uygulandı.');
});
document.querySelector('#resetThemeBtn')?.addEventListener('click', () => {
  localStorage.removeItem('parla:theme');
  location.reload();
});

applyTheme(readJson('parla:theme', null));
injectFavoriteButtons();
renderRolePanels();


// Advanced admin managers
function getPortfolios() {
  const existing = readJson('parla:portfolios', []);
  const last = readJson('parla:lastPortfolio', null);
  if (last && !existing.some(p => p.id === last.id)) return [last, ...existing];
  return existing;
}
function savePortfolios(items) { writeJson('parla:portfolios', items); }
function renderPortfolioManager() {
  const list = document.querySelector('#portfolioManagerList');
  if (!list) return;
  const portfolios = getPortfolios();
  list.innerHTML = portfolios.length ? portfolios.map(p => `
    <article class="manager-item" data-id="${escapeHtml(p.id)}">
      <div><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.location || '')} · ${escapeHtml(p.price || '')}</span></div>
      <div class="manager-actions"><button type="button" data-edit-portfolio="${escapeHtml(p.id)}">Düzenle</button><button type="button" data-delete-portfolio="${escapeHtml(p.id)}">Sil</button></div>
    </article>`).join('') : '<p class="muted">Henüz oluşturulmuş portföy yok. Önce Portföy Ekle bölümünden kayıt oluştur.</p>';
}

document.addEventListener('click', event => {
  const editId = event.target?.dataset?.editPortfolio;
  const deleteId = event.target?.dataset?.deletePortfolio;
  const editAgent = event.target?.dataset?.editAgent;
  const deleteAgent = event.target?.dataset?.deleteAgent;
  if (editId) {
    const portfolio = getPortfolios().find(p => p.id === editId);
    const form = document.querySelector('#portfolioEditForm');
    if (portfolio && form) {
      form.hidden = false;
      ['id','title','price','location','rooms','sqm','description'].forEach(name => { if (form.elements[name]) form.elements[name].value = portfolio[name] || ''; });
      showToast('Portföy düzenleme formuna aktarıldı.');
    }
  }
  if (deleteId) {
    savePortfolios(getPortfolios().filter(p => p.id !== deleteId));
    renderPortfolioManager();
    showToast('Portföy silindi.');
  }
  if (editAgent) {
    const agent = getAgents().find(a => a.id === editAgent);
    const form = document.querySelector('#agentForm');
    if (agent && form) {
      ['id','name','title','phone','email'].forEach(name => { if (form.elements[name]) form.elements[name].value = agent[name] || ''; });
      showToast('Danışman düzenleme formuna aktarıldı.');
    }
  }
  if (deleteAgent) {
    saveAgents(getAgents().filter(a => a.id !== deleteAgent));
    renderAgents();
    showToast('Danışman silindi.');
  }
});

document.querySelector('#portfolioEditForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const id = String(fd.get('id') || '');
  const portfolios = getPortfolios().map(p => p.id === id ? { ...p, title: String(fd.get('title') || ''), price: String(fd.get('price') || ''), location: String(fd.get('location') || ''), rooms: String(fd.get('rooms') || ''), sqm: String(fd.get('sqm') || ''), description: String(fd.get('description') || '') } : p);
  savePortfolios(portfolios);
  e.currentTarget.hidden = true;
  renderPortfolioManager();
  showToast('Portföy güncellendi.');
});

document.querySelector('#sliderForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  writeJson('parla:slider', data);
  const preview = document.querySelector('#sliderPreview');
  if (preview) preview.innerHTML = `<strong>${escapeHtml(data.label)}</strong><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.price)}</p><small>${escapeHtml(data.heroImage)}</small>`;
  showToast('Slider / vitrin ayarları kaydedildi.');
});

function getAgents() { return readJson('parla:agents', [
  { id: 'agent-acane', name: 'Açane Saydıran', title: 'Portföy Danışmanı', phone: '0531 736 64 00', email: 'acane@konutta.demo' },
  { id: 'agent-office', name: 'Konutta.com Ofis Ekibi', title: 'Kurumsal Danışmanlık', phone: '+90 5xx xxx xx xx', email: 'ofis@konutta.demo' },
]); }
function saveAgents(items) { writeJson('parla:agents', items); }
function renderAgents() {
  const list = document.querySelector('#agentsList');
  if (!list) return;
  list.innerHTML = getAgents().map(a => `<article class="manager-item"><div><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml(a.title)} · ${escapeHtml(a.phone)} · ${escapeHtml(a.email)}</span></div><div class="manager-actions"><button type="button" data-edit-agent="${escapeHtml(a.id)}">Düzenle</button><button type="button" data-delete-agent="${escapeHtml(a.id)}">Sil</button></div></article>`).join('');
}
document.querySelector('#agentForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const agent = { id: String(fd.get('id') || `agent-${Date.now()}`), name: String(fd.get('name') || ''), title: String(fd.get('title') || ''), phone: String(fd.get('phone') || ''), email: String(fd.get('email') || '') };
  if (!agent.name) { showToast('Danışman adı zorunlu.'); return; }
  const agents = getAgents().filter(a => a.id !== agent.id);
  saveAgents([agent, ...agents]);
  e.currentTarget.reset();
  renderAgents();
  showToast('Danışman kaydedildi.');
});

document.querySelector('#officeForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  writeJson('parla:office', data);
  const preview = document.querySelector('#officePreview');
  if (preview) preview.innerHTML = `<strong>${escapeHtml(data.officeName)}</strong><p>${escapeHtml(data.address)}</p><small>${escapeHtml(data.phone)} · ${escapeHtml(data.email)} · ${escapeHtml(data.hours)}</small>`;
  showToast('Ofis bilgileri kaydedildi.');
});

function renderMembers() {
  const list = document.querySelector('#membersList');
  if (!list) return;
  const members = getUsers().filter(u => u.role === 'member');
  list.innerHTML = members.length ? members.map(u => `<article class="manager-item"><div><strong>${escapeHtml(u.fullName || u.username)}</strong><span>${escapeHtml(u.username)} · ${escapeHtml(u.phone || 'Telefon yok')}</span></div><em>Üye</em></article>`).join('') : '<p class="muted">Henüz kayıtlı üye yok.</p>';
}

function updateAppointmentStatus(id, status) {
  const appointments = readJson(DEMO_APPOINTMENTS_KEY, []);
  writeJson(DEMO_APPOINTMENTS_KEY, appointments.map(a => a.id === id ? { ...a, status } : a));
  renderAppointments();
  showToast('Randevu durumu güncellendi.');
}

document.addEventListener('change', event => {
  const id = event.target?.dataset?.appointmentStatus;
  if (id) updateAppointmentStatus(id, event.target.value);
});

// Patch appointment renderer to include admin status selectors.
const originalRenderAppointments = renderAppointments;
renderAppointments = function enhancedRenderAppointments() {
  const appointments = readJson(DEMO_APPOINTMENTS_KEY, []);
  const session = getSession();
  const userList = document.querySelector('#userAppointmentsList');
  const adminList = document.querySelector('#adminAppointmentsList');
  const renderUser = items => items.length ? items.map(a => `<article class="appointment-item"><strong>${escapeHtml(a.topic)}</strong><span>${escapeHtml(a.date)} ${escapeHtml(a.time)} · ${escapeHtml(a.status)}</span><small>${escapeHtml(a.fullName || a.username)} ${a.phone ? '· '+escapeHtml(a.phone) : ''}</small><p>${escapeHtml(a.note || '')}</p></article>`).join('') : '<p class="muted">Henüz randevu yok.</p>';
  const renderAdmin = items => items.length ? items.map(a => `<article class="appointment-item"><strong>${escapeHtml(a.topic)}</strong><span>${escapeHtml(a.date)} ${escapeHtml(a.time)}</span><small>${escapeHtml(a.fullName || a.username)} ${a.phone ? '· '+escapeHtml(a.phone) : ''}</small><p>${escapeHtml(a.note || '')}</p><label class="status-select"><span>Durum</span><select data-appointment-status="${escapeHtml(a.id)}"><option ${a.status==='Yeni'?'selected':''}>Yeni</option><option ${a.status==='Onaylandı'?'selected':''}>Onaylandı</option><option ${a.status==='İptal'?'selected':''}>İptal</option><option ${a.status==='Tamamlandı'?'selected':''}>Tamamlandı</option></select></label></article>`).join('') : '<p class="muted">Henüz randevu yok.</p>';
  if (userList) userList.innerHTML = renderUser(appointments.filter(a => a.username === session?.username));
  if (adminList) adminList.innerHTML = renderAdmin(appointments);
};

function renderAdvancedAdmin() {
  renderPortfolioManager();
  renderAgents();
  renderMembers();
  renderAppointments();
}
renderAdvancedAdmin();


// Sahibinden JSON import
const sahibindenSampleJson = {
  source: 'sahibinden',
  listings: [
    {
      ilan_no: '1234567890',
      sahibinden_url: 'https://www.sahibinden.com/ilan/emlak-konut-satilik-ornek-ilan-1234567890/detay',
      baslik: "KONUTTA.COM’DAN ALTINKUM'DA DENİZE YAKIN 2+1 DAİRE",
      islem_tipi: 'Satılık',
      kategori: 'Konut',
      alt_kategori: 'Daire',
      fiyat: '4.750.000 TL',
      il: 'Balıkesir',
      ilce: 'Edremit',
      mahalle: 'Altınkum',
      m2_brut: '110',
      m2_net: '95',
      oda_sayisi: '2+1',
      bina_yasi: '5-10 arası',
      bulundugu_kat: 'Ara Kat',
      isitma: 'Doğalgaz Kombi',
      tapu_durumu: 'Kat Mülkiyeti',
      aciklama: 'Sahibinden JSON aktarımıyla Parla web sitesine eklenen örnek portföy.',
      danisman: 'Konutta.com Ofis Ekibi',
      telefon: '+90 5xx xxx xx xx',
      fotograflar: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'],
      ozellikler: { ic: ['Çelik Kapı', 'Fiber İnternet'], dis: ['Açık Otopark'], muhit: ['Sahil', 'Market'], ulasim: ['Otobüs Durağı'], manzara: ['Şehir'] }
    }
  ]
};

function normalizeSahibindenListings(raw) {
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.listings) ? raw.listings : []);
  if (!list.length) throw new Error('JSON içinde listings dizisi bulunamadı.');
  return list.map((item, index) => {
    const photos = item.fotograflar || item.photos || item.images || [];
    const features = item.ozellikler || item.features || {};
    const location = item.location || [item.il, item.ilce, item.mahalle].filter(Boolean).join(' / ');
    const gross = item.m2_brut || item.m2 || item.sqm || item.metrekare || '';
    return {
      id: `SHBD-${item.ilan_no || item.id || Date.now() + '-' + index}`,
      source: 'sahibinden',
      sourceUrl: item.sahibinden_url || item.url || item.link || '',
      sourceListingNo: item.ilan_no || item.id || '',
      title: item.baslik || item.title || `Sahibinden Portföy ${index + 1}`,
      category: item.kategori || item.category || item.alt_kategori || 'Konut',
      type: item.islem_tipi || item.durum || item.type || 'Satılık',
      price: item.fiyat || item.price || 'Fiyat belirtilmedi',
      location: location || 'Konum belirtilmedi',
      sqm: gross ? `${gross} m²` : (item.m2_net ? `${item.m2_net} m² net` : 'm² belirtilmedi'),
      rooms: item.oda_sayisi || item.rooms || 'Oda belirtilmedi',
      floor: item.bulundugu_kat || item.floor || '',
      heating: item.isitma || item.heating || '',
      bathrooms: item.banyo_sayisi || item.bathrooms || '',
      openAreaSqm: item.acik_alan_m2 || item.openAreaSqm || '',
      titleDeedStatus: item.tapu_durumu || item.titleDeedStatus || '',
      propertyNumber: item.tasinmaz_no || item.tasinmaz_numarasi || item.propertyNumber || '',
      description: item.aciklama || item.description || 'Sahibinden JSON aktarımıyla oluşturulan portföy.',
      advisor: item.danisman || item.advisor || 'Konutta.com Ofis Ekibi',
      phone: item.telefon || item.phone || '',
      photos: photos.map((url, photoIndex) => typeof url === 'string' ? { name: `sahibinden-${item.ilan_no || index}-${photoIndex + 1}`, url } : url),
      features: {
        interior: features.ic || features.interior || [],
        exterior: features.dis || features.exterior || [],
        neighborhood: features.muhit || features.neighborhood || [],
        transport: features.ulasim || features.transport || [],
        view: features.manzara || features.view || [],
        housingType: [item.alt_kategori || item.housingType || item.konut_tipi].filter(Boolean),
        fronts: features.cephe || features.fronts || [],
        deedType: [item.tapu_durumu].filter(Boolean),
      },
      address: { street: item.cadde_sokak || '', buildingNo: item.bina_no || '', apartmentNo: item.daire_no || '' },
      deed: { blockNo: item.ada || '', parcelNo: item.parsel || '', sheetNo: item.pafta || '', deedArea: item.tapu_yuzolcumu || '', landShare: item.arsa_payi || '', volumeNo: '', pageNo: '' },
    };
  });
}

function importSahibindenJsonText(text) {
  const raw = JSON.parse(text);
  const imported = normalizeSahibindenListings(raw);
  const existing = getPortfolios();
  const merged = [...imported, ...existing.filter(old => !imported.some(item => item.id === old.id || (item.sourceListingNo && item.sourceListingNo === old.sourceListingNo)))];
  savePortfolios(merged);
  renderPortfolioManager();
  const result = document.querySelector('#sahibindenImportResult');
  if (result) {
    result.classList.remove('empty');
    result.innerHTML = `<div class="summary-head"><strong>${imported.length} portföy aktarıldı</strong><span>Sahibinden JSON</span></div><div class="summary-tags">${imported.slice(0, 8).map(item => `<span>${escapeHtml(item.title)}</span>`).join('')}</div>`;
  }
  showToast(`${imported.length} Sahibinden portföyü içe aktarıldı.`);
  return imported;
}

document.querySelector('#loadSahibindenSampleBtn')?.addEventListener('click', () => {
  const textarea = document.querySelector('#sahibindenJsonText');
  if (textarea) textarea.value = JSON.stringify(sahibindenSampleJson, null, 2);
  showToast('Örnek Sahibinden JSON yüklendi.');
});

document.querySelector('#sahibindenJsonFile')?.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const textarea = document.querySelector('#sahibindenJsonText');
  if (textarea) textarea.value = text;
  showToast(`${file.name} yüklendi.`);
});

document.querySelector('#importSahibindenJsonBtn')?.addEventListener('click', () => {
  const text = document.querySelector('#sahibindenJsonText')?.value || '';
  if (!text.trim()) { showToast('Önce JSON dosyası seç veya JSON yapıştır.'); return; }
  try { importSahibindenJsonText(text); } catch (error) { showToast(`JSON aktarım hatası: ${error.message}`); }
});


// Public listing pages: advanced filters, sorting and comparison
const COMPARE_KEY = 'parla:compare';
function parseNumber(value) {
  const raw = String(value || '').replace(/[^0-9]/g, '');
  return raw ? Number(raw) : 0;
}
function getCompareIds() { return readJson(COMPARE_KEY, []); }
function setCompareIds(ids) { writeJson(COMPARE_KEY, ids.slice(0, 4)); }
function propertyMatchesPreset(item, preset) {
  if (preset === 'satilik') return item.type === 'Satılık';
  if (preset === 'kiralik') return item.type === 'Kiralık';
  if (preset === 'firsat') return Boolean(item.opportunity || item.featured);
  return true;
}
function renderPublicPropertyCard(item) {
  const compareIds = getCompareIds();
  const checked = compareIds.includes(item.id) ? 'checked' : '';
  return `<article class="property-card enhanced-card" data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(item.type)}" data-category="${escapeHtml(item.category)}" data-location="${escapeHtml(item.location.toLocaleLowerCase('tr-TR'))}" data-title="${escapeHtml(item.title.toLocaleLowerCase('tr-TR'))}">
    <a class="card-link" href="${escapeHtml(item.url)}" aria-label="${escapeHtml(item.title)} detay sayfasını aç">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
      <div class="property-body"><div class="meta"><span>${escapeHtml(item.type)} ${escapeHtml(item.category)}</span><span>${item.opportunity ? 'Fırsat' : 'Doğrulanmış'}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.location)} · ${escapeHtml(item.rooms)} · ${escapeHtml(item.sqm)}</p><div class="summary-tags">${(item.tags || []).slice(0,3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div><div class="card-bottom"><strong>${escapeHtml(item.price)}</strong><span class="detail-link">Detayı gör →</span></div></div>
    </a>
    <div class="card-tools"><button class="ghost-btn small" type="button" data-favorite-title="${escapeHtml(item.title)}">♡ Favori</button><label class="compare-check"><input type="checkbox" data-compare-id="${escapeHtml(item.id)}" ${checked}> Karşılaştır</label></div>
  </article>`;
}
function collectListingFilters() {
  const get = id => document.querySelector(id)?.value || '';
  return {
    q: get('#listingSearch').toLocaleLowerCase('tr-TR'),
    type: get('#listingType') || 'Hepsi',
    category: get('#listingCategory') || 'Hepsi',
    location: get('#listingLocation') || 'Hepsi',
    minPrice: parseNumber(get('#minPrice')),
    maxPrice: parseNumber(get('#maxPrice')),
    minSqm: parseNumber(get('#minSqm')),
    maxSqm: parseNumber(get('#maxSqm')),
    sort: get('#listingSort') || 'featured'
  };
}
function filterPublicProperties() {
  const shell = document.querySelector('[data-listing-page]');
  if (!shell || !Array.isArray(window.PARLA_PROPERTIES || PARLA_PROPERTIES)) return [];
  const preset = shell.dataset.preset || 'all';
  const f = collectListingFilters();
  let items = (window.PARLA_PROPERTIES || PARLA_PROPERTIES).filter(item => propertyMatchesPreset(item, preset));
  items = items.filter(item => {
    const text = [item.title, item.location, item.category, item.group, item.rooms, ...(item.tags || [])].join(' ').toLocaleLowerCase('tr-TR');
    const typeOk = f.type === 'Hepsi' || item.type === f.type;
    const catOk = f.category === 'Hepsi' || item.category === f.category || item.group === f.category;
    const locOk = f.location === 'Hepsi' || item.location.toLocaleLowerCase('tr-TR').includes(f.location.toLocaleLowerCase('tr-TR'));
    const qOk = !f.q || text.includes(f.q);
    const minPriceOk = !f.minPrice || item.priceNumber >= f.minPrice;
    const maxPriceOk = !f.maxPrice || item.priceNumber <= f.maxPrice;
    const minSqmOk = !f.minSqm || item.sqmNumber >= f.minSqm;
    const maxSqmOk = !f.maxSqm || item.sqmNumber <= f.maxSqm;
    return typeOk && catOk && locOk && qOk && minPriceOk && maxPriceOk && minSqmOk && maxSqmOk;
  });
  items.sort((a,b) => {
    if (f.sort === 'price-asc') return a.priceNumber - b.priceNumber;
    if (f.sort === 'price-desc') return b.priceNumber - a.priceNumber;
    if (f.sort === 'sqm-desc') return b.sqmNumber - a.sqmNumber;
    if (f.sort === 'newest') return String(b.id).localeCompare(String(a.id));
    return Number(b.featured || b.opportunity) - Number(a.featured || a.opportunity) || b.priceNumber - a.priceNumber;
  });
  return items;
}
function renderCompareTable() {
  const target = document.querySelector('#compareTable');
  if (!target || typeof PARLA_PROPERTIES === 'undefined') return;
  const selected = getCompareIds().map(id => PARLA_PROPERTIES.find(p => p.id === id)).filter(Boolean);
  if (!selected.length) { target.className = 'compare-table empty'; target.textContent = 'Henüz karşılaştırmaya ilan eklenmedi.'; return; }
  target.className = 'compare-table';
  const rows = [
    ['Fiyat', 'price'], ['Konum', 'location'], ['Kategori', 'category'], ['Durum', 'type'], ['Oda', 'rooms'], ['m²', 'sqm']
  ];
  target.innerHTML = `<table><thead><tr><th>Özellik</th>${selected.map(p => `<th>${escapeHtml(p.title)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,key]) => `<tr><th>${label}</th>${selected.map(p => `<td>${escapeHtml(p[key])}</td>`).join('')}</tr>`).join('')}</tbody></table><button class="ghost-btn" type="button" id="clearCompare">Karşılaştırmayı temizle</button>`;
  document.querySelector('#clearCompare')?.addEventListener('click', () => { setCompareIds([]); renderPublicListings(); showToast('Karşılaştırma temizlendi.'); });
}
function renderPublicListings() {
  const grid = document.querySelector('#dynamicPropertyGrid');
  if (!grid || typeof PARLA_PROPERTIES === 'undefined') return;
  const items = filterPublicProperties();
  grid.innerHTML = items.map(renderPublicPropertyCard).join('');
  const count = document.querySelector('#listingCount');
  if (count) count.textContent = `${items.length} portföy`;
  const summary = document.querySelector('#listingSummary');
  if (summary) summary.textContent = items.length ? 'Filtrelenmiş sonuçlar listeleniyor' : 'Bu filtrelerle sonuç yok';
  const empty = document.querySelector('#dynamicEmptyState');
  if (empty) empty.hidden = items.length !== 0;
  grid.querySelectorAll('[data-compare-id]').forEach(input => input.addEventListener('change', event => {
    const id = event.currentTarget.dataset.compareId;
    let ids = getCompareIds();
    if (event.currentTarget.checked) {
      if (!ids.includes(id)) ids.push(id);
      if (ids.length > 4) { ids = ids.slice(-4); showToast('En fazla 4 ilan karşılaştırılır.'); }
    } else ids = ids.filter(x => x !== id);
    setCompareIds(ids); renderCompareTable(); renderPublicListings();
  }));
  grid.querySelectorAll('[data-favorite-title]').forEach(btn => btn.addEventListener('click', () => showToast(`${btn.dataset.favoriteTitle} favorilere eklendi.`)));
  renderCompareTable();
}
function initPublicListingPage() {
  if (!document.querySelector('[data-listing-page]')) return;
  const params = new URLSearchParams(location.search);
  const map = { '#listingSearch': 'q', '#listingType': 'type', '#listingCategory': 'category' };
  Object.entries(map).forEach(([selector,key]) => { const el = document.querySelector(selector); if (el && params.get(key)) el.value = params.get(key); });
  ['#listingSearch','#listingType','#listingCategory','#listingLocation','#minPrice','#maxPrice','#minSqm','#maxSqm','#listingSort'].forEach(selector => {
    const el = document.querySelector(selector); if (!el) return;
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderPublicListings);
  });
  document.querySelector('#clearListingFilters')?.addEventListener('click', () => {
    ['#listingSearch','#minPrice','#maxPrice','#minSqm','#maxSqm'].forEach(s => { const el = document.querySelector(s); if (el) el.value = ''; });
    ['#listingType','#listingCategory','#listingLocation'].forEach(s => { const el = document.querySelector(s); if (el) el.value = 'Hepsi'; });
    const sort = document.querySelector('#listingSort'); if (sort) sort.value = 'featured';
    renderPublicListings(); showToast('Filtreler temizlendi.');
  });
  renderPublicListings();
}
initPublicListingPage();


// Portfolio form option picker modal
function initPortfolioOptionPickers() {
  const form = document.querySelector('#listingForm');
  if (!form || document.querySelector('#optionPickerModal')) return;
  const modal = document.createElement('div');
  modal.id = 'optionPickerModal';
  modal.className = 'option-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="option-modal-backdrop" data-option-close></div>
    <div class="option-modal-card" role="dialog" aria-modal="true" aria-labelledby="optionModalTitle">
      <div class="option-modal-head"><div><span class="eyebrow">Portföy seçenekleri</span><h2 id="optionModalTitle">Seçenekler</h2><p id="optionModalHint">Uygun maddeleri işaretleyin; seçimler form özetine otomatik yansır.</p></div><button class="ghost-btn" type="button" data-option-close>Kapat</button></div>
      <div class="option-modal-body" id="optionModalBody"></div>
      <div class="option-modal-foot"><button class="primary-btn" type="button" data-option-close>Seçimleri kaydet</button></div>
    </div>`;
  document.body.appendChild(modal);
  const body = modal.querySelector('#optionModalBody');
  const title = modal.querySelector('#optionModalTitle');
  let activeGrid = null;
  let activeHome = null;

  const updateSummary = section => {
    const checked = [...section.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
    const count = section.querySelector('[data-option-count]');
    const chips = section.querySelector('[data-option-chips]');
    if (count) count.textContent = checked.length ? `${checked.length} seçim` : 'Seçim yok';
    if (chips) chips.innerHTML = checked.slice(0, 8).map(v => `<span>${escapeHtml(v)}</span>`).join('') || '<em>Henüz seçim yapılmadı</em>';
  };

  const closeModal = () => {
    if (activeGrid && activeHome) {
      activeGrid.classList.add('option-grid-collapsed');
      activeHome.replaceWith(activeGrid);
      const section = activeGrid.closest('.option-picker-section');
      if (section) updateSummary(section);
    }
    activeGrid = null;
    activeHome = null;
    modal.hidden = true;
    document.body.classList.remove('option-modal-open');
    body.innerHTML = '';
  };

  modal.querySelectorAll('[data-option-close]').forEach(btn => btn.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => { if (!modal.hidden && event.key === 'Escape') closeModal(); });

  form.querySelectorAll('.form-section.wide').forEach(section => {
    const grid = section.querySelector(':scope > .checkbox-grid');
    const heading = section.querySelector('h2');
    if (!grid || !heading || section.dataset.optionPickerReady) return;
    section.dataset.optionPickerReady = 'true';
    section.classList.add('option-picker-section');
    const total = grid.querySelectorAll('input[type="checkbox"]').length;
    const panel = document.createElement('div');
    panel.className = 'option-picker-summary';
    panel.innerHTML = `<div><strong>${escapeHtml(heading.textContent.replace(/^\d+\.\s*/, ''))}</strong><small>${total} seçenek içinden seçim yapın</small><div class="option-picked-chips" data-option-chips><em>Henüz seçim yapılmadı</em></div></div><button class="ghost-btn" type="button" data-open-options>Seçenekleri aç</button><span class="option-count" data-option-count>Seçim yok</span>`;
    section.insertBefore(panel, grid);
    grid.classList.add('option-grid-collapsed');
    grid.addEventListener('change', () => updateSummary(section));
    panel.querySelector('[data-open-options]').addEventListener('click', () => {
      activeGrid = grid;
      activeHome = document.createComment('option-grid-home');
      grid.replaceWith(activeHome);
      body.innerHTML = '';
      body.appendChild(grid);
      grid.classList.remove('option-grid-collapsed');
      title.textContent = heading.textContent;
      modal.hidden = false;
      document.body.classList.add('option-modal-open');
      updateSummary(section);
    });
    updateSummary(section);
  });
}
initPortfolioOptionPickers();


// Portal competitor package: map view, search alerts, valuation and mortgage tools
const SEARCH_ALERTS_KEY = 'konutta:searchAlerts';
function formatTRY(value) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(value || 0));
}
function currentPortalFiltersSummary() {
  const f = typeof collectListingFilters === 'function' ? collectListingFilters() : { q: document.querySelector('#listingSearch')?.value || '', type: document.querySelector('#listingType')?.value || 'Hepsi', location: document.querySelector('#listingLocation')?.value || 'Hepsi' };
  return [f.type !== 'Hepsi' ? f.type : '', f.category !== 'Hepsi' ? f.category : '', f.location !== 'Hepsi' ? f.location : '', f.q || ''].filter(Boolean).join(' · ') || 'Tüm ilanlar';
}
function getMapCoords(item, index) {
  const key = String(item.neighborhood || item.location || '').toLocaleLowerCase('tr-TR');
  const coords = {
    'akçay': [30, 56], 'altınkum': [38, 62], 'güre': [56, 46], 'zeytinli': [66, 34], 'ortaoba': [72, 58], 'mehmetalan': [78, 28], 'burhaniye': [24, 38], 'merkez': [24, 38], 'edremit': [48, 50]
  };
  const found = Object.entries(coords).find(([name]) => key.includes(name));
  if (found) return found[1];
  return [22 + (index * 17) % 66, 24 + (index * 23) % 58];
}
function getPortalMapItems() {
  if (typeof PARLA_PROPERTIES === 'undefined') return [];
  if (typeof filterPublicProperties === 'function' && document.querySelector('[data-listing-page]')) return filterPublicProperties();
  const type = document.querySelector('#listingType')?.value || 'Hepsi';
  const loc = document.querySelector('#listingLocation')?.value || 'Hepsi';
  const q = (document.querySelector('#listingSearch')?.value || '').toLocaleLowerCase('tr-TR');
  return PARLA_PROPERTIES.filter(item => {
    const typeOk = type === 'Hepsi' || item.type === type;
    const locOk = loc === 'Hepsi' || item.location.toLocaleLowerCase('tr-TR').includes(loc.toLocaleLowerCase('tr-TR'));
    const text = [item.title,item.location,item.category,item.group,item.rooms,...(item.tags||[])].join(' ').toLocaleLowerCase('tr-TR');
    return typeOk && locOk && (!q || text.includes(q));
  });
}
function renderPortalMap() {
  const map = document.querySelector('#mapPropertyPins');
  const list = document.querySelector('#mapPropertyList');
  if (!map || !list || typeof PARLA_PROPERTIES === 'undefined') return;
  const items = getPortalMapItems();
  map.innerHTML = items.map((item, index) => {
    const [x,y] = getMapCoords(item, index);
    return `<button class="map-pin" style="left:${x}%;top:${y}%" type="button" data-map-target="${escapeHtml(item.id)}">${escapeHtml(item.price)}</button>`;
  }).join('');
  list.innerHTML = items.map(item => `<article id="map-${escapeHtml(item.id)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.location)} · ${escapeHtml(item.rooms)} · ${escapeHtml(item.sqm)}</span><a class="detail-link" href="${escapeHtml(item.url)}">Detayı gör →</a></article>`).join('') || '<article><strong>Sonuç yok</strong><span>Filtreleri genişletin veya talep bırakın.</span></article>';
  map.querySelectorAll('[data-map-target]').forEach(btn => btn.addEventListener('click', () => document.querySelector(`#map-${CSS.escape(btn.dataset.mapTarget)}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })));
}
function renderSavedSearchAlerts() {
  const target = document.querySelector('#savedSearchAlerts');
  if (!target) return;
  const alerts = readJson(SEARCH_ALERTS_KEY, []);
  target.innerHTML = alerts.slice(0, 8).map(a => `<span>${escapeHtml(a.summary)}${a.name ? ' · ' + escapeHtml(a.name) : ''}</span>`).join('') || '<span>Henüz kayıtlı arama alarmı yok</span>';
}
function saveCurrentSearchAlert(extra = {}) {
  const alerts = readJson(SEARCH_ALERTS_KEY, []);
  const payload = { id: Date.now(), summary: currentPortalFiltersSummary(), name: extra.name || '', phone: extra.phone || '', createdAt: new Date().toISOString() };
  writeJson(SEARCH_ALERTS_KEY, [payload, ...alerts].slice(0, 20));
  renderSavedSearchAlerts();
  showToast('Arama alarmı kaydedildi.');
}
function initPortalMapAndAlerts() {
  document.querySelector('#toggleMapView')?.addEventListener('click', () => {
    const panel = document.querySelector('#listingMapPanel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderPortalMap();
  });
  document.querySelectorAll('#saveSearchAlert').forEach(btn => btn.addEventListener('click', () => saveCurrentSearchAlert()));
  document.querySelector('#searchAlertForm')?.addEventListener('submit', event => {
    event.preventDefault();
    saveCurrentSearchAlert({ name: document.querySelector('#alertName')?.value || '', phone: document.querySelector('#alertPhone')?.value || '' });
    event.currentTarget.reset();
  });
  ['#listingSearch','#listingType','#listingLocation','#listingCategory','#minPrice','#maxPrice','#minSqm','#maxSqm','#listingSort'].forEach(selector => {
    document.querySelector(selector)?.addEventListener('input', renderPortalMap);
    document.querySelector(selector)?.addEventListener('change', renderPortalMap);
  });
  if (document.querySelector('[data-portal-map-page]')) renderPortalMap();
  renderSavedSearchAlerts();
}
function initValuationTool() {
  const form = document.querySelector('#valuationForm');
  if (!form) return;
  const rates = { 'Akçay': 52000, 'Altınkum': 46500, 'Güre': 78000, 'Edremit': 43000, 'Burhaniye': 39000, 'Zeytinli': 31000 };
  const catFactor = { 'Daire': 1, 'Villa': 1.55, 'Müstakil Ev': 1.25, 'Arsa': .48, 'Zeytinlik': .28, 'Ofis': .92 };
  const calc = event => {
    event?.preventDefault();
    const loc = document.querySelector('#valuationLocation').value;
    const cat = document.querySelector('#valuationCategory').value;
    const sqm = parseNumber(document.querySelector('#valuationSqm').value) || 1;
    const base = (rates[loc] || 42000) * (catFactor[cat] || 1) * sqm;
    const low = base * .9, high = base * 1.12;
    const target = document.querySelector('#valuationResult');
    target.innerHTML = `<span class="eyebrow">Tahmini değer</span><span class="big-number">${formatTRY(base)}</span><p>${escapeHtml(loc)} / ${escapeHtml(cat)} için hızlı piyasa bandı. Net ekspertiz için yerinde inceleme gerekir.</p><div class="result-grid"><div><small>Alt bant</small><strong>${formatTRY(low)}</strong></div><div><small>Üst bant</small><strong>${formatTRY(high)}</strong></div><div><small>m² birim</small><strong>${formatTRY((rates[loc]||42000)*(catFactor[cat]||1))}</strong></div></div>`;
  };
  form.addEventListener('submit', calc); calc();
}
function initMortgageTool() {
  const form = document.querySelector('#mortgageForm');
  if (!form) return;
  const calc = event => {
    event?.preventDefault();
    const price = parseNumber(document.querySelector('#homePrice').value);
    const down = parseNumber(document.querySelector('#downPayment').value);
    const principal = Math.max(price - down, 0);
    const rate = Number(String(document.querySelector('#monthlyRate').value).replace(',', '.')) / 100;
    const n = parseNumber(document.querySelector('#loanTerm').value) || 120;
    const monthly = rate ? principal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1) : principal / n;
    const total = monthly * n;
    document.querySelector('#mortgageResult').innerHTML = `<span class="eyebrow">Aylık taksit</span><span class="big-number">${formatTRY(monthly)}</span><p>${formatTRY(principal)} kredi tutarı için yaklaşık ödeme planı.</p><div class="result-grid"><div><small>Kredi</small><strong>${formatTRY(principal)}</strong></div><div><small>Toplam ödeme</small><strong>${formatTRY(total)}</strong></div><div><small>Faiz maliyeti</small><strong>${formatTRY(total - principal)}</strong></div></div>`;
  };
  form.addEventListener('submit', calc); calc();
}
initPortalMapAndAlerts();
initValuationTool();
initMortgageTool();
