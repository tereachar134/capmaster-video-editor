const library = [
  { title: "Downtown Walk", duration: 24, color: "#6f6bff", type: "Video" },
  { title: "Neon Intro", duration: 12, color: "#ff5d9e", type: "Video" },
  { title: "Cafe B-Roll", duration: 18, color: "#4dc7ff", type: "Video" },
  { title: "Voice Over", duration: 31, color: "#66d385", type: "Audio" },
  { title: "Title Card", duration: 6, color: "#f6a84d", type: "Text" }
];

let timeline = [
  { id: crypto.randomUUID(), title: "Downtown Walk", duration: 24, color: "#6f6bff", speed: 1, volume: 80, muted: false, notes: "" },
  { id: crypto.randomUUID(), title: "Neon Intro", duration: 12, color: "#ff5d9e", speed: 1, volume: 80, muted: false, notes: "Opening sequence" }
];

let selectedId = null;
let playing = false;
let playhead = 0;
let playbackTimer;
let pixelsPerSecond = 11;
let snapEnabled = true;

const mediaList = document.getElementById("mediaList");
const timelineTrack = document.getElementById("timelineTrack");
const previewTitle = document.getElementById("previewTitle");
const previewMeta = document.getElementById("previewMeta");
const previewDetails = document.getElementById("previewDetails");
const playPauseBtn = document.getElementById("playPauseBtn");
const rewindBtn = document.getElementById("rewindBtn");
const forwardBtn = document.getElementById("forwardBtn");
const playheadInput = document.getElementById("playheadInput");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const addClipBtn = document.getElementById("addClipBtn");
const duplicateClipBtn = document.getElementById("duplicateClipBtn");
const exportBtn = document.getElementById("exportBtn");
const zoomInput = document.getElementById("zoomInput");
const snapToggle = document.getElementById("snapToggle");

const statusMessage = document.getElementById("statusMessage");
const selectedSummary = document.getElementById("selectedSummary");

const statClips = document.getElementById("statClips");
const statDuration = document.getElementById("statDuration");
const statSpeed = document.getElementById("statSpeed");
const statMuted = document.getElementById("statMuted");

const inspectorEmpty = document.getElementById("inspectorEmpty");
const inspectorForm = document.getElementById("inspectorForm");
const clipNameInput = document.getElementById("clipNameInput");
const clipSpeedInput = document.getElementById("clipSpeedInput");
const clipSpeedOut = document.getElementById("clipSpeedOut");
const clipVolumeInput = document.getElementById("clipVolumeInput");
const clipVolumeOut = document.getElementById("clipVolumeOut");
const clipMuteInput = document.getElementById("clipMuteInput");
const clipNotesInput = document.getElementById("clipNotesInput");

function toTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
}

function roundForSnap(value) {
  if (!snapEnabled) return value;
  return Math.round(value * 2) / 2;
}

function timelineDuration() {
  return timeline.reduce((sum, clip) => sum + clip.duration, 0);
}

function updateStatus(message, isSuccess = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("success", isSuccess);
}

function updateProjectStats() {
  statClips.textContent = String(timeline.length);
  statDuration.textContent = toTime(timelineDuration());

  const avgSpeed = timeline.length
    ? timeline.reduce((sum, clip) => sum + clip.speed, 0) / timeline.length
    : 1;
  statSpeed.textContent = `${avgSpeed.toFixed(2)}x`;
  statMuted.textContent = String(timeline.filter((clip) => clip.muted || clip.volume === 0).length);
}

function renderMediaList() {
  mediaList.innerHTML = "";
  library.forEach((clip) => {
    const li = document.createElement("li");
    li.className = "media-item";
    li.innerHTML = `
      <div>
        <strong>${clip.title}</strong>
        <span>${clip.duration}s • Click to add</span>
      </div>
      <span class="tag">${clip.type}</span>
    `;
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
    volume: clip.type === "Audio" ? 100 : 80,
    muted: false,
    notes: ""
  });
  updateStatus(`Added clip: ${clip.title}`);
  renderTimeline();
}

function renderTimeline() {
  timelineTrack.innerHTML = "";

  timeline.forEach((clip) => {
    const clipEl = document.createElement("div");
    clipEl.className = `clip ${selectedId === clip.id ? "selected" : ""}`;
    clipEl.style.width = `${Math.max(110, clip.duration * pixelsPerSecond)}px`;
    clipEl.style.background = `linear-gradient(130deg, ${clip.color}, color-mix(in oklab, ${clip.color}, #111 45%))`;
    clipEl.innerHTML = `
      <div class="handle left" data-side="left"></div>
      <p class="clip-title">${clip.title}</p>
      <span class="clip-meta">${clip.duration.toFixed(1)}s • ${clip.speed.toFixed(2)}x • ${clip.muted ? "Muted" : `${clip.volume}%`}</span>
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
  updateProjectStats();
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
  clipSpeedInput.value = String(clip.speed);
  clipSpeedOut.textContent = `${clip.speed.toFixed(2)}x`;
  clipVolumeInput.value = String(clip.volume);
  clipVolumeOut.textContent = `${clip.volume}%`;
  clipMuteInput.checked = clip.muted;
  clipNotesInput.value = clip.notes || "";

  selectedSummary.textContent = `Selected: ${clip.title}`;
  updateStatus(`Editing clip: ${clip.title}`);
  renderTimeline();
}

function renderPreview() {
  const clip = findSelectedClip();
  if (clip) {
    previewTitle.textContent = clip.title;
    previewMeta.textContent = `${clip.duration.toFixed(1)}s • ${clip.speed.toFixed(2)}x speed • ${clip.muted ? "Muted" : `${clip.volume}% volume`}`;
    previewDetails.textContent = clip.notes ? `Editor note: ${clip.notes}` : "Tip: Drag clip handles in timeline to trim with precision.";
  } else {
    previewTitle.textContent = "Select a clip";
    previewMeta.textContent = "No clip selected";
    previewDetails.textContent = "Tip: Select a clip to edit speed, volume, and trim points.";
    selectedSummary.textContent = "No clip selected.";
  }
}

function startTrim(event, clipId, side) {
  event.stopPropagation();
  const clip = timeline.find((item) => item.id === clipId);
  if (!clip) return;

  const originX = event.clientX;
  const originDuration = clip.duration;

  function onMove(moveEvent) {
    const delta = (moveEvent.clientX - originX) / pixelsPerSecond;
    if (side === "right") {
      clip.duration = Math.max(2, roundForSnap(originDuration + delta));
    } else {
      clip.duration = Math.max(2, roundForSnap(originDuration - delta));
    }
    updateStatus(`Trimmed ${clip.title} to ${clip.duration.toFixed(1)}s`);
    renderTimeline();
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

function updatePlayhead(value) {
  playhead = Math.max(0, Math.min(Number(playheadInput.max), value));
  playheadInput.value = String(playhead);
  currentTime.textContent = toTime(playhead);
}

playPauseBtn.onclick = () => {
  playing = !playing;
  playPauseBtn.textContent = playing ? "Pause" : "Play";

  clearInterval(playbackTimer);
  if (playing) {
    updateStatus("Playback started", true);
    playbackTimer = setInterval(() => {
      const max = Number(playheadInput.max);
      updatePlayhead(playhead + 0.2);
      if (playhead >= max) {
        playing = false;
        playPauseBtn.textContent = "Play";
        clearInterval(playbackTimer);
        updateStatus("Playback reached timeline end");
      }
    }, 200);
  } else {
    updateStatus("Playback paused");
  }
};

rewindBtn.onclick = () => {
  updatePlayhead(playhead - 2);
  updateStatus("Stepped backward 2 seconds");
};

forwardBtn.onclick = () => {
  updatePlayhead(playhead + 2);
  updateStatus("Stepped forward 2 seconds");
};

playheadInput.oninput = (event) => {
  updatePlayhead(Number(event.target.value));
};

zoomInput.oninput = (event) => {
  pixelsPerSecond = Number(event.target.value);
  updateStatus(`Timeline zoom: ${pixelsPerSecond}px/s`);
  renderTimeline();
};

snapToggle.onchange = () => {
  snapEnabled = snapToggle.checked;
  updateStatus(`Snapping ${snapEnabled ? "enabled" : "disabled"}`);
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
  clip.muted = clipMuteInput.checked;
  clip.notes = clipNotesInput.value.trim();

  updateStatus(`Saved changes to ${clip.title}`, true);
  renderTimeline();
};

addClipBtn.onclick = () => {
  const randomClip = library[Math.floor(Math.random() * library.length)];
  addClipFromLibrary(randomClip);
};

duplicateClipBtn.onclick = () => {
  const clip = findSelectedClip();
  if (!clip) {
    updateStatus("Select a clip before duplicating");
    return;
  }

  timeline.push({ ...clip, id: crypto.randomUUID(), title: `${clip.title} Copy` });
  updateStatus(`Duplicated ${clip.title}`, true);
  renderTimeline();
};

exportBtn.onclick = () => {
  const duration = toTime(timelineDuration());
  const summary = timeline
    .map((clip, index) => `${index + 1}. ${clip.title} (${clip.duration.toFixed(1)}s @ ${clip.speed.toFixed(2)}x${clip.muted ? ", muted" : ""})`)
    .join("\n");

  updateStatus(`Export prepared (${duration})`, true);
  window.alert(`Export queued successfully.\n\nTotal Duration: ${duration}\n\nSequence:\n${summary}`);
};

renderMediaList();
renderTimeline();
updatePlayhead(0);
