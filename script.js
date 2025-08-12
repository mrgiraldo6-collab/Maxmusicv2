/* MaxMusic - Modern player with directory picker and persistent handle (IndexedDB) */
const audio = document.getElementById('audio');
const playlistEl = document.getElementById('playlist');
const nowTitle = document.getElementById('nowTitle');
const btnLoad = document.getElementById('btnLoad');
const btnClear = document.getElementById('btnClear');
const prevBtn = document.getElementById('prev');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const volume = document.getElementById('volume');
const seek = document.getElementById('seek');
const cur = document.getElementById('cur');
const dur = document.getElementById('dur');

let tracks = []; // {name, fileHandle, url}
let currentIndex = 0;
let isPlaying = false;

/* --- IndexedDB helpers (store directory handle) --- */
let db;
function openDB(){
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('maxmusic-db',1);
    r.onupgradeneeded = ()=> r.result.createObjectStore('handles');
    r.onsuccess = ()=> resolve(r.result);
    r.onerror = ()=> reject(r.error);
  });
}

async function saveHandle(key, handle){
  db = db || await openDB();
  const tx = db.transaction('handles','readwrite');
  tx.objectStore('handles').put(handle, key);
  return tx.complete;
}

async function getHandle(key){
  db = db || await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles','readonly');
    const req = tx.objectStore('handles').get(key);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}

/* --- UI functions --- */
function renderPlaylist(){
  playlistEl.innerHTML = '';
  tracks.forEach((t,i) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="meta"><strong>${t.name}</strong><span style="color:var(--muted);font-size:12px">${Math.round(t.size/1024)} KB</span></div>
                    <div>
                      <button data-i="${i}" class="play-btn">▶</button>
                      <button data-i="${i}" class="remove-btn">✖</button>
                    </div>`;
    playlistEl.appendChild(li);
  });
  // attach events
  document.querySelectorAll('.play-btn').forEach(b => b.onclick = (e)=> playIndex(+e.target.dataset.i));
  document.querySelectorAll('.remove-btn').forEach(b => b.onclick = (e)=> { removeIndex(+e.target.dataset.i); });
}

function updateNow(){
  if(tracks[currentIndex]) nowTitle.textContent = tracks[currentIndex].name;
  else nowTitle.textContent = 'Sin pista';
}

function playIndex(i){
  if(!tracks[i]) return;
  currentIndex = i;
  audio.src = tracks[i].url;
  audio.play();
  isPlaying = true;
  playBtn.textContent = '⏸';
  updateNow();
}

function removeIndex(i){
  tracks.splice(i,1);
  if(i===currentIndex) {
    audio.pause();
    audio.src = '';
  }
  if(currentIndex>i) currentIndex--;
  renderPlaylist();
  updateNow();
  persistHandles(); // update stored handles subset
}

/* --- Controls --- */
playBtn.onclick = ()=> {
  if(isPlaying){ audio.pause(); playBtn.textContent='▶'; isPlaying=false; }
  else { audio.play(); playBtn.textContent='⏸'; isPlaying=true; }
};
prevBtn.onclick = ()=> { currentIndex = (currentIndex-1+tracks.length)%tracks.length; playIndex(currentIndex); };
nextBtn.onclick = ()=> { currentIndex = (currentIndex+1)%tracks.length; playIndex(currentIndex); };
volume.oninput = ()=> { audio.volume = volume.value; };

/* seek/progress */
audio.ontimeupdate = ()=> {
  if(audio.duration) {
    seek.value = (audio.currentTime/audio.duration)*100;
    cur.textContent = formatTime(audio.currentTime);
    dur.textContent = formatTime(audio.duration);
  }
};
seek.oninput = ()=> {
  if(audio.duration) audio.currentTime = (seek.value/100)*audio.duration;
};
audio.onended = ()=> { nextBtn.onclick(); };

/* --- Directory picker and loading --- */
async function loadFromDirectoryHandle(dirHandle){
  tracks = [];
  for await (const entry of dirHandle.values()){
    if(entry.kind === 'file' && entry.name.match(/\.(mp3|wav|ogg|m4a)$/i)){
      try{
        const file = await entry.getFile();
        const url = URL.createObjectURL(file);
        tracks.push({name: entry.name, size: file.size, fileHandle: entry, url});
      }catch(err){ console.warn('no se pudo leer', entry.name, err); }
    }
  }
  renderPlaylist();
  updateNow();
  persistHandles(dirHandle);
}

/* Save directory handle to IndexedDB (so we can reopen later) */
async function persistHandles(dirHandle){
  try{
    await saveHandle('dir', dirHandle);
  }catch(e){ console.warn('no guardar handle', e); }
}

/* Try to restore saved handle and load tracks on start */
async function tryRestore(){
  const stored = await getHandle('dir');
  if(stored){
    // verify permission
    try{
      const permission = await stored.requestPermission({mode:'read'});
      if(permission === 'granted' || permission === true) {
        await loadFromDirectoryHandle(stored);
      } else {
        console.log('Permiso denegado para handle guardado');
      }
    }catch(e){ console.warn('no se pudo restaurar handle', e); }
  }
}

btnLoad.onclick = async ()=>{
  if('showDirectoryPicker' in window){
    try{
      const dir = await window.showDirectoryPicker();
      await loadFromDirectoryHandle(dir);
    }catch(err){ console.warn('cancelado o error', err); }
  } else {
    // fallback: input file multiple
    const input = document.createElement('input');
    input.type='file';
    input.multiple=true;
    input.accept='audio/*';
    input.onchange = (e)=>{
      const files = Array.from(e.target.files);
      tracks = files.map(f => ({name:f.name,size:f.size,fileHandle:null,url:URL.createObjectURL(f)}));
      renderPlaylist(); updateNow(); persistHandles();
    };
    input.click();
  }
};

btnClear.onclick = async ()=>{
  tracks = []; renderPlaylist(); updateNow();
  // remove saved handle
  db = db || await openDB();
  const tx = db.transaction('handles','readwrite');
  tx.objectStore('handles').delete('dir');
  tx.complete;
};

/* Persist metadata - since handles are stored we can reload; here we just ensure handle stored */
async function persistHandles(){
  // placeholder, handled elsewhere
}

/* helper */
function formatTime(s){
  if(!s || isNaN(s)) return '00:00';
  const m = Math.floor(s/60).toString().padStart(2,'0');
  const sec = Math.floor(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

/* on load */
tryRestore();
