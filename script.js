const EVENT_TIME_UTC = "2026-06-06T16:45:00Z";
const ZOOM_URL = "https://ligastavok.zoom.us/j/3763541832?pwd=YmM5dUpGbDZPV0VwYmIzQk50SEtHUT09";

const timerParts = {
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const eventStatus = document.getElementById("eventStatus");
const portraitImage = document.getElementById("portraitImage");
const zoomLink = document.getElementById("zoomLink");
const copyZoomButton = document.getElementById("copyZoomButton");
const copyFeedback = document.getElementById("copyFeedback");
const audio = document.getElementById("partyAudio");
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiContext = confettiCanvas.getContext("2d");

const targetTime = new Date(EVENT_TIME_UTC).getTime();
let confettiPieces = [];
let confettiAnimation = null;

async function loadPublicPhoto() {
  const publicPhoto = portraitImage?.dataset.publicPhoto;

  if (!publicPhoto) {
    return;
  }

  try {
    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicPhoto)}`,
    );
    const data = await response.json();

    if (data.href) {
      portraitImage.src = data.href.replace("disposition=attachment", "disposition=inline");
    }
  } catch {
    // The local image remains as a fallback for offline preview.
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateTimer() {
  const remaining = targetTime - Date.now();

  if (remaining <= 0) {
    timerParts.hours.textContent = "00";
    timerParts.minutes.textContent = "00";
    timerParts.seconds.textContent = "00";
    eventStatus.textContent = "Праздник уже начался";
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  timerParts.hours.textContent = pad(hours);
  timerParts.minutes.textContent = pad(minutes);
  timerParts.seconds.textContent = pad(seconds);
}

function setupZoom() {
  if (!ZOOM_URL) {
    zoomLink.setAttribute("aria-disabled", "true");
    copyZoomButton.disabled = true;
    return;
  }

  zoomLink.href = ZOOM_URL;
  zoomLink.removeAttribute("aria-disabled");
  copyZoomButton.disabled = false;
}

async function startMusic() {
  if (!audio || !audio.paused) {
    return;
  }

  try {
    audio.muted = false;
    audio.volume = 0.72;
    await audio.play();
  } catch {
    document.addEventListener("pointerdown", startMusic, { once: true });
    document.addEventListener("keydown", startMusic, { once: true });
  }
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    copyFeedback.textContent = message;
    fireConfetti();
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-999px";
    document.body.appendChild(field);
    field.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(field);

    if (copied) {
      copyFeedback.textContent = message;
      fireConfetti();
    } else {
      copyFeedback.textContent = `Не получилось скопировать автоматически: ${text}`;
    }
  }
}

function resizeConfettiCanvas() {
  const scale = window.devicePixelRatio || 1;
  confettiCanvas.width = Math.floor(window.innerWidth * scale);
  confettiCanvas.height = Math.floor(window.innerHeight * scale);
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  confettiContext.setTransform(scale, 0, 0, scale, 0, 0);
}

function fireConfetti() {
  const colors = ["#1877d6", "#ffd84a", "#0f9b9d", "#ff7b54", "#fff8dc"];
  const count = 130;

  confettiPieces = Array.from({ length: count }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
    y: window.innerHeight * 0.32 + (Math.random() - 0.5) * 60,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    velocityX: (Math.random() - 0.5) * 9,
    velocityY: -8 - Math.random() * 8,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 0.32,
    gravity: 0.22 + Math.random() * 0.08,
    life: 90 + Math.random() * 35,
  }));

  if (!confettiAnimation) {
    confettiAnimation = requestAnimationFrame(animateConfetti);
  }
}

function animateConfetti() {
  confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiPieces = confettiPieces
    .map((piece) => ({
      ...piece,
      x: piece.x + piece.velocityX,
      y: piece.y + piece.velocityY,
      velocityY: piece.velocityY + piece.gravity,
      rotation: piece.rotation + piece.rotationSpeed,
      life: piece.life - 1,
    }))
    .filter((piece) => piece.life > 0 && piece.y < window.innerHeight + 40);

  for (const piece of confettiPieces) {
    confettiContext.save();
    confettiContext.translate(piece.x, piece.y);
    confettiContext.rotate(piece.rotation);
    confettiContext.fillStyle = piece.color;
    confettiContext.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.58);
    confettiContext.restore();
  }

  if (confettiPieces.length) {
    confettiAnimation = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimation = null;
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

copyZoomButton.addEventListener("click", () => {
  if (ZOOM_URL) {
    copyText(ZOOM_URL, "Zoom-ссылка скопирована");
  }
});

zoomLink.addEventListener("click", (event) => {
  if (!ZOOM_URL) {
    event.preventDefault();
    copyFeedback.textContent = "Сначала вставьте Zoom-ссылку в настройках страницы.";
    return;
  }

  fireConfetti();
});

window.addEventListener("resize", resizeConfettiCanvas);

setupZoom();
loadPublicPhoto();
resizeConfettiCanvas();
updateTimer();
startMusic();
setInterval(updateTimer, 1000);
