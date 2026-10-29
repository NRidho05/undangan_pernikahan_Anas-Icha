/* ================= KONFIGURASI ================= */
// Tanggal & jam akad nikah (WIB, +07:00). Ubah sesuai kebutuhan.
const WEDDING_DATE = new Date('2026-11-05T08:00:00+07:00');
const EVENT_TITLE = 'Pernikahan Rina & Fahmi';
const EVENT_PLACE = 'Masjid Al-Ikhlas, Jl. Melati No. 12, Desa Suka Maju, Kec. Cempaka, Kab. Banjar';

/* ================= NAMA TAMU (?to=Nama) ================= */
const to = new URLSearchParams(location.search).get('to');
if (to) document.getElementById('guestName').textContent = to;

/* ================= BUKA UNDANGAN & MUSIK ================= */
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('musicBtn');
const musicPlayer = document.getElementById('musicPlayer');
const musicStatus = document.getElementById('musicStatus');
const setPlaying = on => {
  musicPlayer.classList.toggle('playing', on);
  musicBtn.innerHTML = `<i class="bi ${on ? 'bi-pause-fill' : 'bi-play-fill'}"></i>`;
  musicBtn.setAttribute('aria-label', on ? 'Jeda musik' : 'Putar musik');
  musicStatus.textContent = on ? 'Sedang diputar' : 'Ketuk untuk memutar';
};

document.getElementById('openBtn').addEventListener('click', () => {
  document.body.classList.remove('locked');
  document.getElementById('salam').scrollIntoView({behavior:'smooth'});
  bgm.play().then(() => setPlaying(true)).catch(() => {});
});
musicBtn.addEventListener('click', () => {
  if (bgm.paused) bgm.play().then(() => setPlaying(true)).catch(() => {});
  else { bgm.pause(); setPlaying(false); }
});
bgm.addEventListener('play', () => setPlaying(true));
bgm.addEventListener('pause', () => setPlaying(false));

/* ================= HITUNG MUNDUR ================= */
const pad = n => String(n).padStart(2, '0');
const cd = {};
['months','days','hours','minutes','seconds'].forEach(k => cd[k] = document.getElementById('cd-' + k));

function tick(){
  const now = new Date();
  if (WEDDING_DATE <= now) { Object.values(cd).forEach(el => el.textContent = '00'); return; }

  let months = (WEDDING_DATE.getFullYear() - now.getFullYear()) * 12 + (WEDDING_DATE.getMonth() - now.getMonth());
  let anchor = new Date(now); anchor.setMonth(anchor.getMonth() + months);
  if (anchor > WEDDING_DATE) { months--; anchor = new Date(now); anchor.setMonth(anchor.getMonth() + months); }
  const diff = WEDDING_DATE - anchor;

  cd.months.textContent  = pad(months);
  cd.days.textContent    = pad(Math.floor(diff / 864e5));
  cd.hours.textContent   = pad(Math.floor(diff % 864e5 / 36e5));
  cd.minutes.textContent = pad(Math.floor(diff % 36e5 / 6e4));
  cd.seconds.textContent = pad(Math.floor(diff % 6e4 / 1e3));
}
tick(); setInterval(tick, 1000);

/* ================= SIMPAN KE KALENDER (.ics) ================= */
document.getElementById('calBtn').addEventListener('click', () => {
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(WEDDING_DATE.getTime() + 6 * 36e5);
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Undangan Rina & Fahmi//ID','BEGIN:VEVENT',
    'UID:' + fmt(WEDDING_DATE) + '@undangan-rina-fahmi',
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(WEDDING_DATE),
    'DTEND:' + fmt(end),
    'SUMMARY:' + EVENT_TITLE,
    'LOCATION:' + EVENT_PLACE.replace(/,/g, '\\,'),
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar'}));
  a.download = 'pernikahan-rina-fahmi.ics';
  document.body.appendChild(a); a.click(); a.remove();
});

/* ================= GALERI + LIGHTBOX ================= */
const gallery = document.getElementById('gallery');
const dotsWrap = document.getElementById('gDots');
const imgs = [...gallery.querySelectorAll('img')];

imgs.forEach((img, i) => {
  const d = document.createElement('span');
  const item = img.closest('.gallery__item');
  d.addEventListener('click', () => gallery.scrollTo({left: item.offsetLeft - gallery.offsetLeft - 6, behavior:'smooth'}));
  dotsWrap.appendChild(d);
});
const dots = [...dotsWrap.children];
const stepSize = () => {
  const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
  return gallery.querySelector('.gallery__item').offsetWidth + gap;
};

function updateDots(){
  const items = [...gallery.querySelectorAll('.gallery__item')];
  const idx = items.reduce((closest, item, i) =>
    Math.abs(item.offsetLeft - gallery.offsetLeft - gallery.scrollLeft) <
    Math.abs(items[closest].offsetLeft - gallery.offsetLeft - gallery.scrollLeft) ? i : closest, 0);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}
gallery.addEventListener('scroll', updateDots, {passive:true});
window.addEventListener('resize', updateDots);
updateDots();

document.getElementById('gPrev').addEventListener('click', () => gallery.scrollBy({left:-stepSize(), behavior:'smooth'}));
document.getElementById('gNext').addEventListener('click', () => gallery.scrollBy({left: stepSize(), behavior:'smooth'}));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let galleryPaused = false;
let galleryResumeTimer;

gallery.addEventListener('pointerenter', () => { galleryPaused = true; });
gallery.addEventListener('pointerleave', () => { galleryPaused = false; });
gallery.addEventListener('focusin', () => { galleryPaused = true; });
gallery.addEventListener('focusout', () => { galleryPaused = false; });
gallery.addEventListener('touchstart', () => {
  galleryPaused = true;
  clearTimeout(galleryResumeTimer);
}, {passive:true});
gallery.addEventListener('touchend', () => {
  galleryResumeTimer = setTimeout(() => { galleryPaused = false; }, 2500);
}, {passive:true});

if (!reduceMotion.matches) {
  setInterval(() => {
    if (galleryPaused || document.hidden || gallery.scrollWidth <= gallery.clientWidth) return;

    const atEnd = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2;
    gallery.scrollTo({left: atEnd ? 0 : gallery.scrollLeft + stepSize(), behavior:'smooth'});
  }, 3500);
}

const lb = new bootstrap.Modal(document.getElementById('lightbox'));
const lbImg = document.getElementById('lbImg');
imgs.forEach(img => img.addEventListener('click', () => { lbImg.src = img.src; lbImg.alt = img.alt; lb.show(); }));

/* ================= BUKU TAMU (localStorage) ================= */
const KEY = 'wedding_wishes_rina_fahmi_v3';
localStorage.removeItem('wedding_wishes_rina_fahmi_v2');
const list = document.getElementById('wishList');
const hint = document.getElementById('formHint');
const ATT = {Hadir:'Hadir', Ragu:'Masih ragu', Tidak:'Tidak hadir'};
const guestbookResetUrl = new URL(location.href);
if (guestbookResetUrl.searchParams.has('hapus-ucapan')) {
  localStorage.removeItem(KEY);
  guestbookResetUrl.searchParams.delete('hapus-ucapan');
  history.replaceState(null, '', guestbookResetUrl);
}
const sampleWishes = [
  {name:'Andi Saputra', msg:'Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Aamiin.'},
  {name:'Siti Nurhaliza', msg:'Barakallah untuk kedua mempelai, semoga lancar sampai hari H dan seterusnya.'}
];
const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || [];
    if (!Array.isArray(saved)) return [];
    const wishes = saved.filter(w => !sampleWishes.some(sample => w.name === sample.name && w.msg === sample.msg));
    if (wishes.length !== saved.length) localStorage.setItem(KEY, JSON.stringify(wishes));
    return wishes;
  } catch {
    return [];
  }
};
const save = arr => { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} };

function ago(ts){
  if (!ts) return '';
  const m = Math.floor((Date.now() - ts) / 6e4);
  if (m < 1) return 'Baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  return new Date(ts).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});
}

function render(){
  list.innerHTML = '';
  load().forEach(w => {
    const box = document.createElement('div'); box.className = 'wish';
    const av = document.createElement('div'); av.className = 'wish__av';
    av.textContent = (w.name || '?').trim().charAt(0).toUpperCase();

    const body = document.createElement('div');
    const head = document.createElement('div'); head.className = 'wish__head';
    const nm = document.createElement('strong'); nm.textContent = w.name;
    head.appendChild(nm);
    if (ATT[w.att]) { const b = document.createElement('span'); b.className = 'wish__badge'; b.textContent = ATT[w.att]; head.appendChild(b); }
    const t = ago(w.ts);
    if (t) { const s = document.createElement('span'); s.className = 'wish__time'; s.textContent = t; head.appendChild(s); }

    const p = document.createElement('p'); p.textContent = w.msg;   // textContent: aman dari XSS
    body.append(head, p);
    box.append(av, body);
    list.appendChild(box);
  });
}

document.getElementById('wishForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('wishName');
  const att = document.getElementById('wishAtt');
  const msg = document.getElementById('wishMsg');
  if (!name.value.trim()) { hint.textContent = 'Tulis nama Anda dulu.'; name.focus(); return; }
  if (!msg.value.trim())  { hint.textContent = 'Tulis ucapan atau doa Anda dulu.'; msg.focus(); return; }
  hint.textContent = '';
  const arr = load();
  arr.unshift({name:name.value.trim(), att:att.value, msg:msg.value.trim(), ts:Date.now()});
  save(arr);
  e.target.reset();
  render();
  list.scrollTo({top:0, behavior:'smooth'});
  hint.style.color = 'var(--olive-700)';
  hint.textContent = 'Terima kasih, ucapan Anda sudah terkirim.';
  setTimeout(() => { hint.textContent = ''; hint.style.color = ''; }, 4000);
});
render();

/* ================= ANIMASI MUNCUL SAAT DIGULIR ================= */
const revealTargets = document.querySelectorAll([
  '#salam .verse > *',
  '#mempelai .sec__title, #mempelai .sec__sub, #mempelai .row > div',
  '#acara .sec__title, #acara .orn, #acara .sec__sub, #acara .row > div, #acara #calBtn',
  '#lokasi .sec__title, #lokasi .orn, #lokasi .sec__sub, #lokasi .row > div',
  '#countdown .container > *',
  '#galeri .gallery-kicker, #galeri .sec__title, #galeri .sec__sub, #galeri .gallery__item, #galeri .dots',
  '#ucapan .sec__title, #ucapan .sec__sub, #ucapan .row > div',
  '.footer__top > *, .footer__bottom > *'
].join(','));
const reduceMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reduceMotionPreference.matches && 'IntersectionObserver' in window) {
  const revealGroups = new Map();
  revealTargets.forEach(element => {
    const siblings = revealGroups.get(element.parentElement) || [];
    siblings.push(element);
    revealGroups.set(element.parentElement, siblings);
  });

  revealGroups.forEach(elements => elements.forEach((element, index) => {
    element.classList.add('reveal-item');
    element.classList.add(['reveal-item--up', 'reveal-item--left', 'reveal-item--right', 'reveal-item--soft'][index % 4]);
    element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 110}ms`);
  }));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:.12, rootMargin:'0px 0px -35px 0px'});
  revealTargets.forEach(element => revealObserver.observe(element));
}

/* ================= NAV AKTIF & MENU MOBILE ================= */
const links = [...document.querySelectorAll('#navMenu .nav-link')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
  });
}, {rootMargin:'-45% 0px -50% 0px'});
links.forEach(l => { const s = document.querySelector(l.getAttribute('href')); if (s) spy.observe(s); });

links.forEach(l => l.addEventListener('click', () => {
  const m = document.getElementById('navMenu');
  if (m.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(m).hide();
}));

document.getElementById('year').textContent = new Date().getFullYear();
