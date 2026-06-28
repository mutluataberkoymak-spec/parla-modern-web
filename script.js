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
  location.href = 'gayrimenkuller.html?' + q.toString();
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
  const title = get('title') || `${get('district') || 'Akçay'} ${get('rooms') || ''} ${get('housingType') || 'Portföy'}`.trim() || 'Yeni Parla Portföyü';
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
    description: get('description') || 'Parla Gayrimenkul güvencesiyle detaylı portföy formundan oluşturulan yeni portföy.',
    advisor: get('consultantName') || get('advisor') || 'Parla Ofis Ekibi',
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
  set('description', 'Parla Gayrimenkul güvencesiyle; denize yakın, geniş açık alanlı, modern kullanıma sahip, krediye uygun ve yatırım değeri yüksek özel portföy. Detaylı bilgi ve yer gösterimi için danışmanımızla iletişime geçebilirsiniz.');
  set('officeName', 'Parla Gayrimenkul');
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
const DEFAULT_ADMIN = { username: 'admin', password: '123', role: 'admin', fullName: 'Parla Yönetici' };

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
  { id: 'agent-acane', name: 'Açane Saydıran', title: 'Portföy Danışmanı', phone: '0531 736 64 00', email: 'acane@parla.demo' },
  { id: 'agent-office', name: 'Parla Ofis Ekibi', title: 'Kurumsal Danışmanlık', phone: '+90 5xx xxx xx xx', email: 'ofis@parla.demo' },
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
      baslik: "PARLA'DAN ALTINKUM'DA DENİZE YAKIN 2+1 DAİRE",
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
      danisman: 'Parla Ofis Ekibi',
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
      advisor: item.danisman || item.advisor || 'Parla Ofis Ekibi',
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
