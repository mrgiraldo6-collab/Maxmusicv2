const audioPlayer = document.getElementById('audioPlayer');
const fileInput = document.getElementById('fileInput');
const adContainer = document.getElementById('adContainer');

fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    let current = 0;
    playSong(files[current]);
    audioPlayer.addEventListener('ended', () => {
      current++;
      if (current < files.length) {
        showAd();
        playSong(files[current]);
      }
    });
  }
});

function playSong(file) {
  audioPlayer.src = URL.createObjectURL(file);
  audioPlayer.play();
}

function showAd() {
  adContainer.innerHTML = '<p>Mostrando anuncio de AdMob: ca-app-pub-7390447937302532/1936500172</p>';
  console.log("AdMob mostrado");
}document.getElementById('loadMusicBtn').addEventListener('click', async () => {
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav|ogg)$/i)) {
          const file = await entry.getFile();
          const url = URL.createObjectURL(file);
          audioPlayer.src = url;
          audioPlayer.play();
          break; // Reproduce la primera canción encontrada
        }
      }
    } catch (err) {
      console.error("Error al acceder a la carpeta:", err);
    }
  } else {
    alert("Tu navegador no soporta la carga directa desde carpetas. Usa Chrome/Edge en Android.");
  }
});

