const library = [
  { title: "Downtown Walk", duration: 24, color: "#6f6bff" },
  { title: "Neon Intro", duration: 12, color: "#ff5d9e" },
  { title: "Cafe B-Roll", duration: 18, color: "#4dc7ff" },
  { title: "Voice Over", duration: 31, color: "#66d385" }
];

let timeline = [
  { id: crypto.randomUUID(), title: "Downtown Walk", duration: 24, color: "#6f6bff", speed: 1, volume: 80 },
  { id: crypto.randomUUID(), title: "Neon Intro", duration: 12, color: "#ff5d9e", speed: 1, volume: 80 }
];

let selectedId = null;
let playing = false;
let playhead = 0;
let playbackTimer;

const mediaList = document.getElementById("mediaList");
const timelineTrack = document.getElementById("timelineTrack");
const previewTitle = document.getElementById("previewTitle");
const previewMeta = document.getElementById("previewMeta");
const playPauseBtn = document.getElementById("playPauseBtn");
const playheadInput = document.getElementById("playheadInput");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const addClipBtn = document.getElementById("addClipBtn");
const exportBtn = document.getElementById("exportBtn");

const inspectorEmpty = document.getElementById("inspectorEmpty");
const inspectorForm = document.getElementById("inspectorForm");
const clipNameInput = document.getElementById("clipNameInput");
const clipSpeedInput = document.getElementById("clipSpeedInput");
const clipSpeedOut = document.getElementById("clipSpeedOut");
const clipVolumeInput = document.getElementById("clipVolumeInput");
const clipVolumeOut = document.getElementById("clipVolumeOut");

function toTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
}

function timelineDuration() {
  return timeline.reduce((sum, clip) => sum + clip.duration, 0);
}

function renderMediaList() {
  mediaList.innerHTML = "";
  library.forEach((clip) => {
    const li = document.createElement("li");
    li.className = "media-item";
    li.innerHTML = `<strong>${clip.title}</strong><span>${clip.duration}s • Tap to add</span>`;
    li.onclick = () => addClipFromLibrary(clip);
    mediaList.appendChild(li);
  });
}

function addClipFromLibrary(clip) {
  timeline.push({
    id: crypto.randomUUID(),
    title: clip.title,
    duration: clip.duration,
    color: clip.color,
    speed: 1,
    volume: 80
  });
  renderTimeline();
}

function renderTimeline() {
  timelineTrack.innerHTML = "";

  timeline.forEach((clip) => {
    const clipEl = document.createElement("div");
    clipEl.className = `clip ${selectedId === clip.id ? "selected" : ""}`;
    clipEl.style.width = `${Math.max(110, clip.duration * 11)}px`;
    clipEl.style.background = `linear-gradient(130deg, ${clip.color}, color-mix(in oklab, ${clip.color}, #111 45%))`;
    clipEl.innerHTML = `
      <div class="handle left" data-side="left"></div>
      <p class="clip-title">${clip.title}</p>
      <span class="clip-meta">${clip.duration.toFixed(1)}s • ${clip.speed.toFixed(2)}x</span>
      <div class="handle right" data-side="right"></div>
    `;

    clipEl.onclick = () => selectClip(clip.id);

    [...clipEl.querySelectorAll(".handle")].forEach((handle) => {
      handle.onpointerdown = (event) => startTrim(event, clip.id, handle.dataset.side);
    });

    timelineTrack.appendChild(clipEl);
  });

  const duration = timelineDuration();
  playheadInput.max = Math.max(duration, 1);
  totalTime.textContent = toTime(duration);
  renderPreview();
}

function findSelectedClip() {
  return timeline.find((clip) => clip.id === selectedId);
}

function selectClip(clipId) {
  selectedId = clipId;
  const clip = findSelectedClip();
  if (!clip) return;

  inspectorEmpty.classList.add("hidden");
  inspectorForm.classList.remove("hidden");

  clipNameInput.value = clip.title;
  clipSpeedInput.value = clip.speed;
  clipSpeedOut.textContent = `${clip.speed.toFixed(2)}x`;
  clipVolumeInput.value = clip.volume;
  clipVolumeOut.textContent = `${clip.volume}%`;

  renderTimeline();
}

function renderPreview() {
  const clip = findSelectedClip();
  if (clip) {
    previewTitle.textContent = clip.title;
    previewMeta.textContent = `${clip.duration.toFixed(1)}s • ${clip.speed.toFixed(2)}x speed • ${clip.volume}% volume`;
  } else {
    previewTitle.textContent = "Select a clip";
    previewMeta.textContent = "No clip selected";
  }
}

function startTrim(event, clipId, side) {
  event.stopPropagation();
  const clip = timeline.find((item) => item.id === clipId);
  if (!clip) return;

  const originX = event.clientX;
  const originDuration = clip.duration;

  function onMove(moveEvent) {
    const delta = (moveEvent.clientX - originX) / 11;
    if (side === "right") {
      clip.duration = Math.max(2, originDuration + delta);
    } else {
      clip.duration = Math.max(2, originDuration - delta);
    }
    renderTimeline();
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

playPauseBtn.onclick = () => {
  playing = !playing;
  playPauseBtn.textContent = playing ? "Pause" : "Play";

  clearInterval(playbackTimer);
  if (playing) {
    playbackTimer = setInterval(() => {
      const max = Number(playheadInput.max);
      playhead = Math.min(max, playhead + 0.2);
      playheadInput.value = String(playhead);
      currentTime.textContent = toTime(playhead);
      if (playhead >= max) {
        playing = false;
        playPauseBtn.textContent = "Play";
        clearInterval(playbackTimer);
      }
    }, 200);
  }
};

playheadInput.oninput = (event) => {
  playhead = Number(event.target.value);
  currentTime.textContent = toTime(playhead);
};

clipSpeedInput.oninput = () => {
  clipSpeedOut.textContent = `${Number(clipSpeedInput.value).toFixed(2)}x`;
};

clipVolumeInput.oninput = () => {
  clipVolumeOut.textContent = `${clipVolumeInput.value}%`;
};

inspectorForm.onsubmit = (event) => {
  event.preventDefault();
  const clip = findSelectedClip();
  if (!clip) return;

  clip.title = clipNameInput.value.trim() || clip.title;
  clip.speed = Number(clipSpeedInput.value);
  clip.volume = Number(clipVolumeInput.value);
  renderTimeline();
};

addClipBtn.onclick = () => {
  const randomClip = library[Math.floor(Math.random() * library.length)];
  addClipFromLibrary(randomClip);
};

exportBtn.onclick = () => {
  const summary = timeline
    .map((clip, index) => `${index + 1}. ${clip.title} (${clip.duration.toFixed(1)}s @ ${clip.speed.toFixed(2)}x)`)
    .join("\n");
  window.alert(`Export queued:\n\n${summary}`);
};

renderMediaList();
renderTimeline();
currentTime.textContent = toTime(0);
