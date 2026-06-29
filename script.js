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
  if (session?.role === 'admin') showAdminSection('portalDashboardPanel', false);
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
  const list = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.listings)
      ? raw.listings
      : (Array.isArray(raw?.['İlan Listesi'])
        ? raw['İlan Listesi']
        : (Array.isArray(raw?.['Ilan Listesi']) ? raw['Ilan Listesi'] : [])));

  if (!list.length) throw new Error('JSON içinde listings veya İlan Listesi dizisi bulunamadı.');

  const pick = (obj, keys, fallback = '') => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };
  const yesList = (obj, keys) => keys.filter(key => obj?.[key] === 'Evet' || obj?.[key] === true);
  const splitAddress = value => {
    const parts = String(value || '').split('/').map(part => part.trim()).filter(Boolean);
    return { il: parts[0] || '', ilce: parts[1] || '', mahalle: parts[2] || '' };
  };
  const plainText = html => String(html || '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return list.map((item, index) => {
    const attrs = pick(item, ['Özellikler', 'ozellikler', 'features'], {}) || {};
    const photos = pick(item, ['fotograflar', 'photos', 'images', 'Aktif Görsel Listesi', 'Aktif Gorsel Listesi'], []) || [];
    const categoriesText = pick(item, ['Kategoriler', 'kategori', 'category'], '');
    const categories = String(categoriesText).split(',').map(x => x.trim()).filter(Boolean);
    const addressParts = splitAddress(pick(item, ['Adres', 'adres'], ''));
    const location = pick(item, ['location', 'Konum Metni'], '') || [
      pick(item, ['il'], addressParts.il),
      pick(item, ['ilce'], addressParts.ilce),
      pick(item, ['mahalle'], addressParts.mahalle),
    ].filter(Boolean).join(' / ');
    const gross = pick(item, ['m2_brut', 'm2', 'sqm', 'metrekare'], '') || pick(attrs, ['m² (Brüt)', 'm2_brut', 'm²', 'm2'], '');
    const net = pick(item, ['m2_net'], '') || pick(attrs, ['m² (Net)', 'm2_net'], '');
    const listingNo = pick(item, ['ilan_no', 'İlan no', 'Ilan no', 'id'], '');
    const descriptionHtml = pick(item, ['aciklama', 'Açıklama', 'Açiklama', 'description'], '');
    const titleDeed = pick(item, ['tapu_durumu'], '') || pick(attrs, ['Tapu Durumu'], '');
    const activePhotoList = Array.isArray(photos) ? photos : [];

    return {
      id: `SHBD-${listingNo || Date.now() + '-' + index}`,
      source: 'sahibinden',
      sourceUrl: pick(item, ['sahibinden_url', 'url', 'link', 'Sahibinden URL', 'İlan URL'], ''),
      sourceListingNo: listingNo,
      title: pick(item, ['baslik', 'Başlık', 'Baslik', 'title'], `Sahibinden Portföy ${index + 1}`),
      category: pick(item, ['kategori', 'category'], '') || categories[1] || categories[0] || pick(attrs, ['Emlak Tipi'], 'Konut'),
      type: pick(item, ['islem_tipi', 'durum', 'type'], '') || (pick(attrs, ['Emlak Tipi'], '').includes('Kiralık') ? 'Kiralık' : 'Satılık'),
      price: pick(item, ['fiyat', 'Fiyat', 'price'], 'Fiyat belirtilmedi'),
      location: location || 'Konum belirtilmedi',
      coordinates: pick(item, ['Konum', 'coordinates'], ''),
      sqm: gross ? `${gross} m²` : (net ? `${net} m² net` : 'm² belirtilmedi'),
      rooms: pick(item, ['oda_sayisi', 'rooms'], '') || pick(attrs, ['Oda Sayısı'], 'Oda belirtilmedi'),
      floor: pick(item, ['bulundugu_kat', 'floor'], '') || pick(attrs, ['Bulunduğu Kat'], ''),
      heating: pick(item, ['isitma', 'heating'], '') || pick(attrs, ['Isıtma'], ''),
      bathrooms: pick(item, ['banyo_sayisi', 'bathrooms'], '') || pick(attrs, ['Banyo Sayısı'], ''),
      openAreaSqm: pick(item, ['acik_alan_m2', 'openAreaSqm'], ''),
      titleDeedStatus: titleDeed,
      propertyNumber: pick(item, ['tasinmaz_no', 'tasinmaz_numarasi', 'propertyNumber'], '') || pick(attrs, ['Taşınmaz Numarası'], ''),
      description: plainText(descriptionHtml) || 'Sahibinden JSON aktarımıyla oluşturulan portföy.',
      advisor: pick(item, ['danisman', 'Danışman', 'advisor'], 'Konutta.com Ofis Ekibi'),
      phone: pick(item, ['telefon', 'Telefon', 'phone'], ''),
      photos: activePhotoList.map((url, photoIndex) => typeof url === 'string'
        ? { name: `sahibinden-${listingNo || index}-${photoIndex + 1}`, url }
        : url),
      features: {
        interior: pick(attrs, ['ic', 'interior'], null) || yesList(attrs, ['ADSL', 'Çelik Kapı', 'Fiber İnternet', 'Görüntülü Diyafon', 'Hilton Banyo', 'Isıcam', 'Kartonpiyer', 'Laminat Zemin', 'Mutfak (Ankastre)', 'PVC Doğrama', 'Spot Aydınlatma', 'Vestiyer']),
        exterior: pick(attrs, ['dis', 'exterior'], null) || yesList(attrs, ['Asansör', 'Otopark', 'Açık Otopark', 'Hidrofor', 'Isı Yalıtımı', 'Kablo TV', 'Uydu', 'Ses Yalıtımı']),
        neighborhood: pick(attrs, ['muhit', 'neighborhood'], null) || yesList(attrs, ['Alışveriş Merkezi', 'Belediye', 'Cami', 'Eczane', 'Hastane', 'Market', 'Park', 'Plaj', 'Semt Pazarı', 'Şehir Merkezi']),
        transport: pick(attrs, ['ulasim', 'transport'], null) || yesList(attrs, ['Anayol', 'Cadde', 'Dolmuş', 'Minibüs', 'Otobüs Durağı', 'Sahil']),
        view: pick(attrs, ['manzara', 'view'], null) || yesList(attrs, ['Deniz', 'Doğa', 'Park & Yeşil Alan', 'Şehir']),
        housingType: [categories.at(-1), pick(attrs, ['Emlak Tipi'], ''), pick(item, ['alt_kategori', 'housingType', 'konut_tipi'], '')].filter(Boolean),
        fronts: yesList(attrs, ['Batı', 'Doğu', 'Güney', 'Kuzey']),
        deedType: [titleDeed].filter(Boolean),
      },
      address: { street: pick(item, ['cadde_sokak'], ''), buildingNo: pick(item, ['bina_no'], ''), apartmentNo: pick(item, ['daire_no'], '') },
      deed: { blockNo: pick(item, ['ada'], ''), parcelNo: pick(item, ['parsel'], ''), sheetNo: pick(item, ['pafta'], ''), deedArea: pick(item, ['tapu_yuzolcumu'], ''), landShare: pick(item, ['arsa_payi'], ''), volumeNo: '', pageNo: '' },
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
function getPublicImportedProperties() {
  const imported = readJson('parla:portfolios', []);
  const staticIds = new Set(((window.PARLA_PROPERTIES || [])).map(item => item.id));
  const placeholder = 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80';
  return imported
    .filter(item => item && item.id && !staticIds.has(item.id))
    .map((item, index) => {
      const photo = item.photos?.find(p => p?.url)?.url || '';
      const image = /^https?:\/\//i.test(photo) ? photo : placeholder;
      const priceNumber = parseNumber(item.price);
      const sqmNumber = parseNumber(item.sqm);
      const featureTags = [
        ...(item.features?.interior || []),
        ...(item.features?.exterior || []),
        ...(item.features?.neighborhood || []),
        ...(item.features?.transport || []),
        ...(item.features?.view || [])
      ].slice(0, 4);
      return {
        ...item,
        id: item.id,
        title: item.title || `Aktarılan Portföy ${index + 1}`,
        type: item.type || 'Satılık',
        category: item.category || item.features?.housingType?.[0] || 'Konut',
        group: item.category || 'Konut',
        location: item.location || 'Konum belirtilmedi',
        rooms: item.rooms || 'Oda belirtilmedi',
        sqm: item.sqm || 'm² belirtilmedi',
        sqmNumber,
        price: item.price || 'Fiyat belirtilmedi',
        priceNumber,
        featured: true,
        opportunity: false,
        source: item.source === 'sahibinden' ? 'Sahibinden aktarımı' : 'Panel aktarımı',
        listedDaysAgo: 0,
        hasMap: Boolean(item.coordinates),
        hasVideo: false,
        priceDropped: false,
        investmentScore: 78,
        trustScore: 90,
        rentYield: 55,
        buildingAge: item.buildingAge || '',
        image,
        url: `panel.html#imported-${encodeURIComponent(item.id)}`,
        tags: featureTags.length ? featureTags : ['JSON aktarımı', item.sourceListingNo ? `İlan No ${item.sourceListingNo}` : 'Panel portföyü'].filter(Boolean)
      };
    });
}
function getAllPublicProperties() {
  const base = Array.isArray(window.PARLA_PROPERTIES || PARLA_PROPERTIES) ? (window.PARLA_PROPERTIES || PARLA_PROPERTIES) : [];
  return [...getPublicImportedProperties(), ...base];
}
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
      <div class="property-body"><div class="meta"><span>${escapeHtml(item.type)} ${escapeHtml(item.category)}</span><span>${item.opportunity ? 'Fırsat' : 'Doğrulanmış'}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.location)} · ${escapeHtml(item.rooms)} · ${escapeHtml(item.sqm)}</p><div class="smart-badges"><span>Güven ${escapeHtml(item.trustScore || Math.min(98, (item.investmentScore || 75) + 6))}</span><span>Güncel ${escapeHtml(item.listedDaysAgo || 1)} gün</span><span>Yatırım ${escapeHtml(item.investmentScore || 75)}</span><span>${escapeHtml(item.source || 'Emlak Ofisinden')}</span>${item.priceDropped ? '<span>Fiyatı düştü</span>' : ''}</div><div class="summary-tags">${(item.tags || []).slice(0,3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div><div class="card-bottom"><strong>${escapeHtml(item.price)}</strong><span class="detail-link">Detayı gör →</span></div></div>
    </a>
    <div class="card-tools"><button class="ghost-btn small" type="button" data-favorite-title="${escapeHtml(item.title)}">♡ Favori</button><button class="ghost-btn small" type="button" data-report-listing="${escapeHtml(item.title)}">İlanı bildir</button><label class="compare-check"><input type="checkbox" data-compare-id="${escapeHtml(item.id)}" ${checked}> Karşılaştır</label></div>
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
    rooms: get('#listingRooms') || 'Hepsi',
    source: get('#listingSource') || 'Hepsi',
    date: get('#listingDate') || 'Hepsi',
    feature: get('#listingFeature') || 'Hepsi',
    sort: get('#listingSort') || 'featured'
  };
}
function filterPublicProperties() {
  const shell = document.querySelector('[data-listing-page]');
  if (!shell) return [];
  const preset = shell.dataset.preset || 'all';
  const f = collectListingFilters();
  let items = getAllPublicProperties().filter(item => propertyMatchesPreset(item, preset));
  items = items.filter(item => {
    const text = [item.title, item.location, item.category, item.group, item.rooms, ...(item.tags || [])].join(' ').toLocaleLowerCase('tr-TR');
    const typeOk = f.type === 'Hepsi' || item.type === f.type;
    const catOk = f.category === 'Hepsi' || item.category === f.category || item.group === f.category;
    const locOk = f.location === 'Hepsi' || item.location.toLocaleLowerCase('tr-TR').includes(f.location.toLocaleLowerCase('tr-TR'));
    const roomOk = f.rooms === 'Hepsi' || item.rooms === f.rooms || item.category === f.rooms;
    const sourceOk = f.source === 'Hepsi' || (item.source || 'Emlak Ofisinden') === f.source;
    const dateOk = f.date === 'Hepsi' || (f.date === 'Son 24 saat' ? item.listedDaysAgo <= 1 : f.date === 'Son 7 gün' ? item.listedDaysAgo <= 7 : item.listedDaysAgo <= 30);
    const featureOk = f.feature === 'Hepsi' || (f.feature === 'Fiyatı düşen' ? item.priceDropped : f.feature === 'Haritada' ? item.hasMap : [item.title, item.location, item.category, item.group, item.rooms, ...(item.tags || [])].join(' ').toLocaleLowerCase('tr-TR').includes(f.feature.toLocaleLowerCase('tr-TR')));
    const qOk = !f.q || text.includes(f.q);
    const minPriceOk = !f.minPrice || item.priceNumber >= f.minPrice;
    const maxPriceOk = !f.maxPrice || item.priceNumber <= f.maxPrice;
    const minSqmOk = !f.minSqm || item.sqmNumber >= f.minSqm;
    const maxSqmOk = !f.maxSqm || item.sqmNumber <= f.maxSqm;
    return typeOk && catOk && locOk && roomOk && sourceOk && dateOk && featureOk && qOk && minPriceOk && maxPriceOk && minSqmOk && maxSqmOk;
  });
  items.sort((a,b) => {
    if (f.sort === 'investment-score') return (b.investmentScore || 0) - (a.investmentScore || 0);
    if (f.sort === 'rent-yield') return (b.rentYield || 0) - (a.rentYield || 0);
    if (f.sort === 'price-drop') return Number(b.priceDropped || false) - Number(a.priceDropped || false) || b.priceNumber - a.priceNumber;
    if (f.sort === 'price-asc') return a.priceNumber - b.priceNumber;
    if (f.sort === 'price-desc') return b.priceNumber - a.priceNumber;
    if (f.sort === 'sqm-asc') return a.sqmNumber - b.sqmNumber;
    if (f.sort === 'sqm-desc') return b.sqmNumber - a.sqmNumber;
    if (f.sort === 'location-asc') return a.location.localeCompare(b.location, 'tr');
    if (f.sort === 'newest') return (a.listedDaysAgo || 999) - (b.listedDaysAgo || 999);
    return Number(b.featured || b.opportunity) - Number(a.featured || a.opportunity) || (b.investmentScore || 0) - (a.investmentScore || 0);
  });
  return items;
}
function renderCompareTable() {
  const target = document.querySelector('#compareTable');
  if (!target) return;
  const allProperties = getAllPublicProperties();
  const selected = getCompareIds().map(id => allProperties.find(p => p.id === id)).filter(Boolean);
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
  if (!grid) return;
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
  ['#listingSearch','#listingType','#listingCategory','#listingLocation','#minPrice','#maxPrice','#minSqm','#maxSqm','#listingRooms','#listingSource','#listingDate','#listingFeature','#listingSort'].forEach(selector => {
    const el = document.querySelector(selector); if (!el) return;
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderPublicListings);
  });
  document.querySelector('#clearListingFilters')?.addEventListener('click', () => {
    ['#listingSearch','#minPrice','#maxPrice','#minSqm','#maxSqm'].forEach(s => { const el = document.querySelector(s); if (el) el.value = ''; });
    ['#listingType','#listingCategory','#listingLocation','#listingRooms','#listingSource','#listingDate','#listingFeature'].forEach(s => { const el = document.querySelector(s); if (el) el.value = 'Hepsi'; });
    const sort = document.querySelector('#listingSort'); if (sort) sort.value = 'featured';
    renderPublicListings(); showToast('Filtreler temizlendi.');
  });
  renderPublicListings();
}
initPublicListingPage();

document.querySelector('#toggleListView')?.addEventListener('click', () => {
  const grid = document.querySelector('#dynamicPropertyGrid');
  if (!grid) return;
  grid.classList.toggle('list-view');
  document.querySelector('#toggleListView').textContent = grid.classList.contains('list-view') ? 'Grid görünüm' : 'Liste görünümü';
});



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
  const allProperties = typeof getAllPublicProperties === 'function' ? getAllPublicProperties() : (window.PARLA_PROPERTIES || []);
  if (typeof filterPublicProperties === 'function' && document.querySelector('[data-listing-page]')) return filterPublicProperties();
  const type = document.querySelector('#listingType')?.value || 'Hepsi';
  const loc = document.querySelector('#listingLocation')?.value || 'Hepsi';
  const q = (document.querySelector('#listingSearch')?.value || '').toLocaleLowerCase('tr-TR');
  return allProperties.filter(item => {
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


// Competitor benchmark admin panels: Sahibinden + Emlakjet + Hepsiemlak inspired modules
const portalDemo = {
  metrics: [
    ['Ziyaret / 24s', '555', '+12%', 'Sahibinden tarzı saatlik ziyaret'],
    ['Görüntülenme', '3.012', '+7%', 'Emlakjet toplam görüntülenme'],
    ['Yayındaki ilan', '45', '+9%', 'Hepsiemlak aktif portföy'],
    ['Favoriye alınma', '17', '+20%', 'Favori performansı'],
    ['Mesaj', '4', '+0%', 'İlan mesajları'],
    ['WhatsApp', '8', '+167%', 'WhatsApp etkileşimi'],
    ['Telefon gösterimi', '12', '+31%', 'Telefon/arama metriği'],
    ['Profil skoru', '78%', '+18%', 'Danışman/ofis tamamlama']
  ],
  listings: [
    ['Aktif', 'ALTINKUM DENİZE 150M 2+1 DAİRE', '4.750.000 TL', '1.214 görüntülenme · 12 favori'],
    ['Aktif', 'GÜRE HAVUZLU 3+1 VİLLA', '36.000.000 TL', '842 görüntülenme · 7 favori'],
    ['Pasif', 'EDREMİT 3+1 KİRALIK DAİRE', '20.000 TL', 'Son yayın: 16.06.2026'],
    ['Taslak', 'ZEYTİNLİ ARSA TASLAĞI', 'Fiyat bekliyor', 'Fotoğraf eksik'],
    ['Süresi Dolan', 'BURHANİYE MÜSTAKİL EV', '17.500.000 TL', 'Yenileme önerilir'],
    ['Silinen', 'ESKİ OFİS İLANI', 'Arşiv', 'Geri yüklenebilir demo']
  ],
  crm: [
    ['Rehber', '128 kişi', 'Alıcı, satıcı, mülk sahibi ve yatırımcı kayıtları'],
    ['Talepler', '24 aktif talep', 'Fiyat aralığı, lokasyon, tür ve uygun ilan eşleştirme'],
    ['Yer Gösterme', '9 planlı gösterim', 'Müşteri, ilan, izlenim ve not takibi'],
    ['Sözleşmeler', '6 taslak', 'Kiralama/satış aracılık sözleşmesi ve belge arşivi']
  ],
  messages: [
    ['Mesaj', 'Altınkum 2+1 için konum sorusu', 'Yeni'],
    ['WhatsApp', 'Güre villa için randevu talebi', 'Yanıt bekliyor'],
    ['Arama', 'Mobil arama: Zeytinli arsa', 'Tamamlandı'],
    ['Bildirim', 'Paket yenileme ve vitrin hakkı uyarısı', 'Okunmadı']
  ],
  reports: [
    ['Yayındaki ilan raporu', '45 ilan', '7/14/30/90 gün kırılımı'],
    ['Görüntülenme raporu', '3.012 görüntülenme', 'İlana ve danışmana göre'],
    ['Mesaj raporu', '4 mesaj', 'Kanal bazlı yanıt takibi'],
    ['Favori raporu', '17 favori', 'İlan performans sinyali'],
    ['Arama raporu', '12 telefon', 'Mobil arama ve telefon gösterimi'],
    ['Doping/Turbo raporu', '43 kullanım', 'Paket hakkı tüketimi'],
    ['Paket raporu', '55 kalan ilan', 'Excel aktarım taslağı'],
    ['Mülk sahibi raporu', 'Paylaşılabilir link', 'İlan sahibine performans özeti']
  ],
  packages: [
    ['İlan hakkı', '100 toplam · 55 kalan', 45],
    ['Vitrin hakkı', '12 toplam · 8 kalan', 33],
    ['Turbo / Doping', '127 toplam · 84 kalan', 34],
    ['İlanım güncel', '108 toplam · 83 kalan', 23],
    ['Danışman hakkı', '5 toplam · 5 kalan', 0],
    ['Değerleme hakkı', '3 rapor · 3 kalan', 0]
  ],
  sharing: [
    ['İlan Havuzu', 'Paylaşıma açık portföyleri keşfet', 'Görüntüle'],
    ['Gelen Talepler', 'Diğer ofislerden gelen paylaşım talepleri', '3 yeni'],
    ['Giden Talepler', 'Paylaşım istediğin portföyler', '5 takipte'],
    ['Kontrollü Paylaşım', 'Sadece seçilen profesyonellere özel ilan', 'Kapalı ağ']
  ],
  valuations: [
    ['Altınkum 2+1 Daire', 'Tahmini 5.72M TL', 'Emsal ve m² bandı hazır'],
    ['Güre Villa', 'Tahmini 35.4M TL', 'Lüks segment karşılaştırma'],
    ['Zeytinli Arsa', 'Tahmini 29.1M TL', 'İmar ve lokasyon etkisi'],
    ['Akçay Ofis', 'Kira bandı hazır', 'Ticari değerleme']
  ]
};

function renderPortalBenchmarkPanels() {
  const metricTarget = document.querySelector('#portalMetricsGrid');
  if (metricTarget) metricTarget.innerHTML = portalDemo.metrics.map(([label,value,delta,hint]) => `<div class="portal-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><em>${escapeHtml(delta)}</em><small>${escapeHtml(hint)}</small></div>`).join('');
  const topVisits = document.querySelector('#topListingVisits');
  if (topVisits) topVisits.innerHTML = `<div class="kpi-table">${portalDemo.listings.slice(0,3).map((l,i)=>`<div class="kpi-row"><span>${i+1}. ${escapeHtml(l[1])}</span><strong>${i===0?'106':i===1?'80':'73'}</strong></div>`).join('')}</div>`;
  const quota = document.querySelector('#packageQuotaSummary');
  if (quota) quota.innerHTML = `<div class="kpi-table">${portalDemo.packages.slice(0,4).map(([name,text,used])=>`<div><div class="kpi-row"><span>${escapeHtml(name)}</span><strong>${escapeHtml(text)}</strong></div><div class="mini-bar"><i style="width:${used}%"></i></div></div>`).join('')}</div>`;
  renderLifecycle('Aktif');
  const tabs = document.querySelector('#lifecycleTabs');
  if (tabs && !tabs.dataset.ready) {
    tabs.dataset.ready = 'true';
    const statuses = ['Aktif','Pasif','Taslak','Süresi Dolan','Silinen'];
    tabs.innerHTML = statuses.map(st => `<button type="button" data-life-status="${escapeHtml(st)}">${escapeHtml(st)} <span>${portalDemo.listings.filter(x=>x[0]===st).length}</span></button>`).join('');
    tabs.addEventListener('click', e => { if (e.target?.dataset?.lifeStatus) renderLifecycle(e.target.dataset.lifeStatus); });
  }
  const crm = document.querySelector('#crmCards');
  if (crm) crm.innerHTML = portalDemo.crm.map(([h,n,p])=>`<article class="crm-card"><span>${escapeHtml(n)}</span><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p><button class="ghost-btn" type="button">Demo aç</button></article>`).join('');
  const inbox = document.querySelector('#messageInbox');
  if (inbox) inbox.innerHTML = portalDemo.messages.map(([type,title,status])=>`<article class="manager-item"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(type)}</span></div><span class="status-pill">${escapeHtml(status)}</span></article>`).join('');
  const feed = document.querySelector('#notificationFeed');
  if (feed) feed.innerHTML = `<h3>Bildirimler</h3><div class="kpi-table"><div class="kpi-row"><span>Paket yenileme</span><strong>22 gün</strong></div><div class="kpi-row"><span>Profil eksikleri</span><strong>5 alan</strong></div><div class="kpi-row"><span>Yeni talep</span><strong>3</strong></div></div>`;
  const reports = document.querySelector('#reportCards');
  if (reports) reports.innerHTML = portalDemo.reports.map(([h,n,p])=>`<article class="report-card"><span>${escapeHtml(n)}</span><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></article>`).join('');
  const comp = document.querySelector('#competitionReport');
  if (comp) comp.innerHTML = `<div class="kpi-table"><div class="kpi-row"><span>Ofisim ilan başına görüntülenme</span><strong>5.4</strong></div><div class="kpi-row"><span>Bölge ortalaması</span><strong>9.5</strong></div><div class="mini-bar"><i style="width:57%"></i></div><p>Hepsiemlak rekabet raporu mantığı: bölge ortalamasının altındaki ilanlara vitrin/turbo/güncelleme önerilir.</p></div>`;
  const packages = document.querySelector('#boostPackageCards');
  if (packages) packages.innerHTML = portalDemo.packages.map(([h,n,used])=>`<article class="package-card"><span>${escapeHtml(n)}</span><h3>${escapeHtml(h)}</h3><div class="mini-bar"><i style="width:${used}%"></i></div><button class="ghost-btn" type="button">Planla</button></article>`).join('');
  const sharing = document.querySelector('#sharingNetworkCards');
  if (sharing) sharing.innerHTML = portalDemo.sharing.map(([h,p,n])=>`<article class="sharing-card"><span>${escapeHtml(n)}</span><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></article>`).join('');
  const profile = document.querySelector('#profileCompletionCard');
  if (profile) profile.innerHTML = `<div class="score-ring">78%</div><div><h3>Profil tamamlanma skoru</h3><p>Eksik alanlar tamamlandıkça danışman ve ofis sayfası güçlenir.</p><div class="check-chip-list"><span>Logo var</span><span>Ofis adresi var</span><span>Yetki belgesi eklenecek</span><span>Sosyal medya eksik</span><span>Hakkımızda geliştirilecek</span><span>Hizmet dilleri eksik</span></div></div>`;
  const vals = document.querySelector('#valuationReportCards');
  if (vals) vals.innerHTML = portalDemo.valuations.map(([h,n,p])=>`<article class="valuation-card"><span>${escapeHtml(n)}</span><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p><a class="detail-link" href="emlak-degerleme.html">Değerleme aracına git →</a></article>`).join('');
}
function renderLifecycle(status) {
  const list = document.querySelector('#lifecycleList');
  if (!list) return;
  document.querySelectorAll('[data-life-status]').forEach(btn => btn.classList.toggle('active', btn.dataset.lifeStatus === status));
  const items = portalDemo.listings.filter(x => x[0] === status);
  list.innerHTML = items.length ? items.map(([st,title,price,meta]) => `<article class="manager-item"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(price)} · ${escapeHtml(meta)}</span></div><span class="status-pill">${escapeHtml(st)}</span></article>`).join('') : '<p class="muted">Bu statüde ilan yok.</p>';
}
renderPortalBenchmarkPanels();


// Public benchmark enhancements: AI search, find-for-me, detailed filters and list view
const FIND_FOR_ME_KEY = 'konutta:findForMe';
document.querySelector('[data-ai-search]')?.addEventListener('submit', event => {
  event.preventDefault();
  const q = new FormData(event.currentTarget).get('q') || '';
  location.href = 'ilanlar.html?q=' + encodeURIComponent(q) + '&sort=investment-score';
});
document.querySelector('#findForMeForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const current = readJson(FIND_FOR_ME_KEY, []);
  writeJson(FIND_FOR_ME_KEY, [{ id: Date.now(), ...data }, ...current].slice(0,20));
  event.currentTarget.reset();
  showToast('Arama talebin kaydedildi. Uygun portföy eşleştirme havuzuna düştü.');
});


// Trust center and listing report flow
const TRUST_REPORTS_KEY = 'konutta:trustReports';
function getTrustReports() { return readJson(TRUST_REPORTS_KEY, []); }
function saveTrustReport(report) {
  const current = getTrustReports();
  writeJson(TRUST_REPORTS_KEY, [{ id: `BIL-${Date.now()}`, createdAt: new Date().toISOString(), ...report }, ...current].slice(0, 50));
  renderTrustReports();
}
function renderTrustReports() {
  const list = document.querySelector('#trustReportList');
  if (!list) return;
  const reports = getTrustReports();
  list.innerHTML = reports.length ? reports.slice(0, 8).map(r => `<span>${escapeHtml(r.reason || 'Bildirim')} · ${escapeHtml(r.listing || r.title || 'İlan')}</span>`).join('') : '<span>Henüz bildirim yok</span>';
}
document.querySelector('#trustReportForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  saveTrustReport(data);
  event.currentTarget.reset();
  showToast('Bildirim alındı. Güven ön inceleme kuyruğuna eklendi.');
});
document.addEventListener('click', event => {
  const title = event.target?.dataset?.reportListing;
  if (!title) return;
  saveTrustReport({ listing: title, title, reason: 'İlan kartından şüpheli ilan bildirimi', note: 'Kullanıcı ilan kartından bildirdi.' });
  showToast('İlan bildirimi kaydedildi. Güven ekibi ön inceleme yapacak.');
});
renderTrustReports();
