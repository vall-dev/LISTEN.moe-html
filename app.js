
const STATIONS = {
  jpop: {
    stream: 'https://listen.moe/stream',
    ws:     'wss://listen.moe/gateway_v2',
    name:   'JPOP',
  },
  kpop: {
    stream: 'https://listen.moe/kpop/stream',
    ws:     'wss://listen.moe/kpop/gateway_v2',
    name:   'KPOP',
  },
};


let station     = 'jpop';
let isPlaying   = false;
let isMuted     = false;
let volume      = 0.8;
let ws          = null;
let wsHB        = null;
let currentSong = null;
let songStart   = 0;
let songDur     = 0;
let progressInt = null;
let toastTmr    = null;
let historyArr  = [];
let favorites   = JSON.parse(localStorage.getItem('yr_favs') || '[]');
let eqAnimId    = null;
const EQ_COUNT  = 32;

const audio       = document.getElementById('audioEl');
const playBtn     = document.getElementById('playBtn');
const playIcon    = document.getElementById('playIcon');
const songTitle   = document.getElementById('songTitle');
const songArtist  = document.getElementById('songArtist');
const songAnime   = document.getElementById('songAnime');
const sideTitle   = document.getElementById('sideTitle');
const sideArtist  = document.getElementById('sideArtist');
const artImg      = document.getElementById('artImg');
const artFallback = document.getElementById('artFallback');
const artRing     = document.getElementById('artRing');
const artBadge    = document.getElementById('artPlayingBadge');
const progressFill = document.getElementById('progressFill');
const timeElapsed = document.getElementById('timeElapsed');
const timeDuration = document.getElementById('timeDuration');
const listenerCnt = document.getElementById('listenerCount');
const stationChip = document.getElementById('stationChip');
const favoriteBtn = document.getElementById('favoriteBtn');
const favoriteIcon = document.getElementById('favoriteIcon');
const volumeIcon  = document.getElementById('volumeIcon');
const eqBarsEl    = document.getElementById('eqBars');
const historyList = document.getElementById('historyList');
const toast       = document.getElementById('toast');
const toastIcon   = document.getElementById('toastIcon');
const toastMsg    = document.getElementById('toastMsg');
const historyPanel = document.getElementById('historyPanel');
const historyOverlay = document.getElementById('historyOverlay');


window.addEventListener('load', () => {
  audio.volume = volume;
  buildEqBars();
  connectWS('jpop');
});


function buildEqBars() {
  eqBarsEl.innerHTML = '';
  for (let i = 0; i < EQ_COUNT; i++) {
    const bar = document.createElement('span');
    bar.className = 'eq-bar idle';
    const minH = 3 + Math.random() * 6;
    const maxH = 18 + Math.random() * 38;
    const dur  = (0.45 + Math.random() * 0.55).toFixed(2);
    bar.style.setProperty('--min-h', minH + 'px');
    bar.style.setProperty('--max-h', maxH + 'px');
    bar.style.setProperty('--dur', dur + 's');
    bar.style.height = minH + 'px';
    bar.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
    eqBarsEl.appendChild(bar);
  }
}

function setEqState(playing) {
  document.querySelectorAll('.eq-bar').forEach(bar => {
    bar.className = 'eq-bar ' + (playing ? 'active' : 'idle');
    if (!playing) {
      const minH = parseFloat(bar.style.getPropertyValue('--min-h'));
      bar.style.height = minH + 'px';
    }
  });
}


function connectWS(st) {
  if (ws) { ws.onclose = null; ws.close(); }
  clearInterval(wsHB);

  ws = new WebSocket(STATIONS[st].ws);

  ws.onopen = () => console.log('[WS] connected', st);

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);

      if (data.op === 0) {
        const interval = data.d?.heartbeat || 45000;
        wsHB = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 9 }));
        }, interval);
        ws.send(JSON.stringify({ op: 2, d: { auth: '' } }));
      }

      if (data.op === 1) handleSong(data.d);
    } catch (err) {
      console.error('[WS]', err);
    }
  };

  ws.onerror  = (err) => console.error('[WS] error', err);
  ws.onclose  = () => {
    clearInterval(wsHB);
    setTimeout(() => connectWS(station), 5000);
  };
}


function handleSong(data) {
  if (!data?.song) return;
  const song      = data.song;
  const listeners = data.listeners;
  const start     = data.startTime;
  const dur       = song.duration || 0;


  if (currentSong && currentSong.id !== song.id) addToHistory(currentSong);
  currentSong = song;
  songDur   = dur;
  songStart = start ? new Date(start).getTime() : Date.now();

  const title  = song.title || 'Unknown';
  const artist = (song.artists || []).map(a => a.name).join(', ') || '—';
  const anime  = song.albums?.[0]?.name || song.source || '';

  const imgFile = song.albums?.[0]?.image || song.image || null;
  const artUrl  = imgFile ? 'https://cdn.listen.moe/covers/' + imgFile : null;

  songTitle.textContent  = title;
  songArtist.textContent = artist;
  songAnime.textContent  = anime;
  sideTitle.textContent  = title;
  sideArtist.textContent = artist;
  document.title         = title + ' — VALL RADIO';

  if (listeners !== undefined) listenerCnt.textContent = listeners.toLocaleString();

  loadArt(artUrl);
  updateFavBtn(song);
  startProgress(dur);
}
function loadArt(url) {
  if (!url) {
    showFallback();
    return;
  }
  const tmp = new Image();
  tmp.onload = () => {
    artImg.src = url;
    artImg.style.display = 'block';
    artFallback.style.display = 'none';
  };
  tmp.onerror = showFallback;
  tmp.src = url;
}

function showFallback() {
  artImg.style.display = 'none';
  artFallback.style.display = 'flex';
}

function startProgress(dur) {
  clearInterval(progressInt);
  timeDuration.textContent = dur > 0 ? fmt(dur) : '—';
  if (dur <= 0) { progressFill.style.width = '0%'; return; }

  progressInt = setInterval(() => {
    const elapsed = (Date.now() - songStart) / 1000;
    const pct = Math.min((elapsed / dur) * 100, 100);
    progressFill.style.width = pct + '%';
    timeElapsed.textContent = fmt(elapsed);
  }, 1000);
}

function fmt(s) {
  const sec = Math.floor(s % 60);
  const min = Math.floor(s / 60);
  return min + ':' + String(sec).padStart(2, '0');
}

function togglePlay() {
  isPlaying ? stopStream() : startStream();
}

function startStream() {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  audio.src     = STATIONS[station].stream;
  audio.volume  = volume;
  audio.muted   = isMuted;

  const p = audio.play();
  if (p) {
    p.then(() => onPlaySuccess()).catch(() => {
      setTimeout(() => {
        audio.src = STATIONS[station].stream + '?r=' + Date.now();
        audio.play().then(onPlaySuccess).catch(() => {
          showToast('ph-warning', 'Playback blocked — click play again');
        });
      }, 800);
    });
  }
}

function onPlaySuccess() {
  isPlaying = true;
  playIcon.className = 'ph-fill ph-pause';
  artRing.classList.add('playing');
  artBadge.style.display = 'flex';
  setEqState(true);
  showToast('ph-play', 'Playing ' + STATIONS[station].name);
}

function stopStream() {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  isPlaying = false;
  playIcon.className = 'ph-fill ph-play';
  artRing.classList.remove('playing');
  artBadge.style.display = 'none';
  setEqState(false);
  showToast('ph-pause', 'Paused');
}

function setVolume(val) {
  volume = val / 100;
  audio.volume = volume;
  isMuted = (volume === 0);
  updateVolIcon();
}

function toggleMute() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  updateVolIcon();
  showToast(isMuted ? 'ph-speaker-x' : 'ph-speaker-high', isMuted ? 'Muted' : 'Unmuted');
}

function updateVolIcon() {
  volumeIcon.className = isMuted || volume === 0
    ? 'ph ph-speaker-x'
    : volume < 0.4
      ? 'ph ph-speaker-low'
      : 'ph ph-speaker-high';
}

function switchStation(st) {
  if (station === st) return;
  station = st;

  document.getElementById('tabJpop').classList.toggle('active', st === 'jpop');
  document.getElementById('tabKpop').classList.toggle('active', st === 'kpop');
  stationChip.textContent = STATIONS[st].name;

  connectWS(st);
  if (isPlaying) startStream();
  showToast('ph-radio', 'Switched to ' + STATIONS[st].name);
}

function toggleFavorite() {
  if (!currentSong) return;
  const id  = currentSong.id;
  const idx = favorites.findIndex(f => f.id === id);

  if (idx >= 0) {
    favorites.splice(idx, 1);
    favoriteBtn.classList.remove('active');
    favoriteIcon.className = 'ph ph-heart';
    showToast('ph-heart-break', 'Removed from favorites');
  } else {
    favorites.push({
      id,
      title:  currentSong.title || 'Unknown',
      artist: (currentSong.artists || []).map(a => a.name).join(', '),
    });
    favoriteBtn.classList.add('active');
    favoriteIcon.className = 'ph-fill ph-heart';
    showToast('ph-heart', 'Added to favorites');
  }
  localStorage.setItem('yr_favs', JSON.stringify(favorites));
}

function updateFavBtn(song) {
  const isFav = favorites.some(f => f.id === song.id);
  favoriteBtn.classList.toggle('active', isFav);
  favoriteIcon.className = isFav ? 'ph-fill ph-heart' : 'ph ph-heart';
}

function addToHistory(song) {
  if (!song) return;
  const imgFile = song.albums?.[0]?.image || null;
  historyArr.unshift({
    id:     song.id,
    title:  song.title || 'Unknown',
    artist: (song.artists || []).map(a => a.name).join(', ') || '—',
    img:    imgFile ? 'https://cdn.listen.moe/covers/' + imgFile : null,
    time:   new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  });
  if (historyArr.length > 20) historyArr.pop();
  renderHistory();
}

function renderHistory() {
  if (!historyArr.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <i class="ph-thin ph-music-note-simple"></i>
        <span>No tracks yet. Start listening!</span>
      </div>`;
    return;
  }
  historyList.innerHTML = historyArr.map(h => `
    <div class="history-item">
      <div class="h-thumb">
        ${h.img
          ? `<img src="${h.img}" alt="" loading="lazy" />`
          : `<i class="ph ph-music-note"></i>`}
      </div>
      <div class="h-info">
        <div class="h-title">${esc(h.title)}</div>
        <div class="h-artist">${esc(h.artist)}</div>
      </div>
      <div class="h-time">${h.time}</div>
    </div>`).join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function toggleHistoryPanel() {
  const open = historyPanel.classList.toggle('open');
  historyOverlay.classList.toggle('show', open);
}

function showToast(iconClass, msg) {
  toastIcon.className = 'ph ' + iconClass;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => toast.classList.remove('show'), 2800);
}

audio.addEventListener('error', () => {
  if (isPlaying) setTimeout(() => startStream(), 3000);
});
audio.addEventListener('ended', () => {
  if (isPlaying) startStream();
});
