const timeEl = document.getElementById("time");
const c = document.getElementById("c");
const ctx = c.getContext("2d");

const minsEl = document.getElementById("mins");
const btnSet = document.getElementById("set");
const btnStart = document.getElementById("start");
const btnPause = document.getElementById("pause");
const btnReset = document.getElementById("reset");

let total = 25 * 60;
let remaining = total;
let timer = null;
let endAt = 0;
let running = false;

const N = 11;
const CELLS = buildDiamondCells(N);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function fmt(s) {
  const sec = Math.max(0, Math.ceil(s));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function buildDiamondCells(size) {
  const mid = (size - 1) / 2;
  const out = [];
  for (let r = 0; r < size; r += 1) {
    for (let col = 0; col < size; col += 1) {
      if (Math.abs(r - mid) + Math.abs(col - mid) <= mid) {
        out.push([r, col]);
      }
    }
  }
  return out;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hourglassCardPath(x, y, w, h) {
  const cx = x + w / 2;
  const my = y + h / 2;
  const neck = 14;
  const pad = 8;

  ctx.beginPath();
  ctx.moveTo(cx - neck, my);
  ctx.quadraticCurveTo(x + 10, my - 24, x + 8, y + 30);
  ctx.quadraticCurveTo(x + 8, y + pad, x + 28, y + pad);
  ctx.lineTo(x + w - 28, y + pad);
  ctx.quadraticCurveTo(x + w - 8, y + pad, x + w - 8, y + 30);
  ctx.quadraticCurveTo(x + w - 10, my - 24, cx + neck, my);
  ctx.quadraticCurveTo(x + w - 10, my + 24, x + w - 8, y + h - 30);
  ctx.quadraticCurveTo(x + w - 8, y + h - pad, x + w - 28, y + h - pad);
  ctx.lineTo(x + 28, y + h - pad);
  ctx.quadraticCurveTo(x + 8, y + h - pad, x + 8, y + h - 30);
  ctx.quadraticCurveTo(x + 10, my + 24, cx - neck, my);
  ctx.closePath();
}

function drawMatrix(baseX, baseY, sizePx, onCount, onColor, offColor, mode) {
  const cell = sizePx / N;
  const pad = Math.max(0.6, cell * 0.07);
  const sorted = CELLS.slice().sort((a, b) => {
    if (mode === "top") {
      return b[0] - a[0] || Math.abs(a[1] - (N - 1) / 2) - Math.abs(b[1] - (N - 1) / 2);
    }
    return a[0] - b[0] || Math.abs(a[1] - (N - 1) / 2) - Math.abs(b[1] - (N - 1) / 2);
  });

  for (let i = 0; i < sorted.length; i += 1) {
    const [r, col] = sorted[i];
    const x = baseX + col * cell + pad;
    const y = baseY + r * cell + pad;
    const w = cell - pad * 2;
    const lit = i < onCount;

    ctx.fillStyle = lit ? onColor : offColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + w / 2, Math.max(1.8, w / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1f55";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + w / 2, Math.max(1.8, w / 2), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNeckFlow(cx, y1, y2) {
  if (!running || remaining <= 0) return;
  const dots = 4;
  const span = y2 - y1;
  const step = span / dots;
  ctx.fillStyle = "#ffe45a";
  for (let i = 0; i < dots; i += 1) {
    const y = y1 + ((Date.now() / 80 + i * step) % span);
    ctx.beginPath();
    ctx.arc(cx, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  const p = total ? clamp(remaining / total, 0, 1) : 0;
  const topP = p;
  const bottomP = 1 - p;

  timeEl.textContent = fmt(remaining);
  ctx.clearRect(0, 0, c.width, c.height);

  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#2a1f88");
  bg.addColorStop(1, "#13163f");
  ctx.fillStyle = bg;
  roundRect(0, 0, c.width, c.height, 20);
  ctx.fill();

  const cardW = 172;
  const cardH = 320;
  const cardX = (c.width - cardW) / 2;
  const cardY = 92;

  hourglassCardPath(cardX, cardY, cardW, cardH);
  ctx.fillStyle = "#8d80f8";
  ctx.fill();
  hourglassCardPath(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = "#b2a7ff";
  ctx.lineWidth = 2;
  ctx.stroke();

  const mSize = 116;
  const topX = cardX + (cardW - mSize) / 2;
  const topY = cardY + 18;
  const botX = topX;
  const botY = cardY + cardH - mSize - 18;

  const topOn = Math.round(CELLS.length * topP);
  const botOn = Math.round(CELLS.length * bottomP);

  drawMatrix(topX, topY, mSize, topOn, "#ffe45a", "#2c2f76", "top");
  drawMatrix(botX, botY, mSize, botOn, "#ffe45a", "#20275f", "bottom");

  const neckX = cardX + cardW / 2;
  const topNeckY = topY + mSize - 4;
  const botNeckY = botY + 4;
  drawNeckFlow(neckX, topNeckY, botNeckY);

  ctx.fillStyle = "#ffe45a";
  ctx.beginPath();
  ctx.arc(neckX, botY + mSize - 3, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  running = false;
}

function tick() {
  remaining = Math.max(0, (endAt - Date.now()) / 1000);
  render();
  if (remaining <= 0) stop();
}

btnSet.onclick = () => {
  stop();
  const m = Math.max(1, Math.min(180, Number(minsEl.value) || 25));
  total = m * 60;
  remaining = total;
  render();
};

btnStart.onclick = () => {
  if (running || remaining <= 0) return;
  running = true;
  endAt = Date.now() + remaining * 1000;
  tick();
  timer = setInterval(tick, 90);
};

btnPause.onclick = () => {
  if (!running) return;
  tick();
  stop();
};

btnReset.onclick = () => {
  stop();
  remaining = total;
  render();
};

render();
