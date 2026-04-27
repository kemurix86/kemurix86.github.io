const DISCORD_USER_ID = "1489358022189777117";

document.getElementById("year").textContent = new Date().getFullYear();

const discordLink = document.getElementById("discord-link");
discordLink.addEventListener("click", (e) => {
  e.preventDefault();
  const handle = discordLink.dataset.copy;
  navigator.clipboard?.writeText(handle).then(
    () => toast(`copiado: ${handle}`),
    () => toast(handle),
  );
});

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1500);
}

const dot = document.getElementById("status-dot");
const footStatus = document.getElementById("foot-status");
const npSection = document.getElementById("now-playing");
const npCard = document.getElementById("np-card");
const npArt = document.getElementById("np-art");
const npTitle = document.getElementById("np-title");
const npArtist = document.getElementById("np-artist");
const npProgress = document.getElementById("np-progress");

let spotifyState = null;
let progressTimer = null;

function applyPresence(data) {
  if (!data) return;

  const status = data.discord_status || "offline";
  dot.dataset.status = status;
  dot.title = status;
  footStatus.textContent = status;

  if (data.listening_to_spotify && data.spotify) {
    spotifyState = data.spotify;
    npTitle.textContent = data.spotify.song;
    npArtist.textContent = data.spotify.artist;
    npArt.src = data.spotify.album_art_url || "";
    npArt.alt = data.spotify.album || "";
    npCard.href = `https://open.spotify.com/track/${data.spotify.track_id}`;
    npSection.hidden = false;
    startProgress();
  } else {
    spotifyState = null;
    npSection.hidden = true;
    stopProgress();
  }
}

function startProgress() {
  stopProgress();
  const tick = () => {
    if (!spotifyState?.timestamps) return;
    const { start, end } = spotifyState.timestamps;
    const now = Date.now();
    const total = end - start;
    const elapsed = Math.min(Math.max(now - start, 0), total);
    const pct = total > 0 ? (elapsed / total) * 100 : 0;
    npProgress.style.width = `${pct}%`;
  };
  tick();
  progressTimer = setInterval(tick, 1000);
}

function stopProgress() {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = null;
  npProgress.style.width = "0%";
}

function connect() {
  const ws = new WebSocket("wss://api.lanyard.rest/socket?compression=false");
  let heartbeat;

  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);

    if (msg.op === 1) {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
      heartbeat = setInterval(() => {
        ws.send(JSON.stringify({ op: 3 }));
      }, msg.d.heartbeat_interval);
    }

    if (msg.op === 0) {
      applyPresence(msg.d);
    }
  });

  ws.addEventListener("close", () => {
    clearInterval(heartbeat);
    setTimeout(connect, 2000);
  });

  ws.addEventListener("error", () => ws.close());
}

connect();
