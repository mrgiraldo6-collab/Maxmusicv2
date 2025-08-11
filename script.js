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
}
