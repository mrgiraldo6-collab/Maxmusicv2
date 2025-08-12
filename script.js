const audioPlayer = document.getElementById('audioPlayer');

// Botón para cargar música desde el teléfono
document.getElementById('loadMusicBtn').addEventListener('click', async () => {
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
    alert("Tu navegador no soporta la carga directa desde carpetas. Usa Chrome o Edge en Android.");
  }
});
