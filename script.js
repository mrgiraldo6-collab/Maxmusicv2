document.getElementById('fileInput').addEventListener('change', function(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const player = document.getElementById('audioPlayer');
        player.src = URL.createObjectURL(files[0]);
        player.play();
    }
});
