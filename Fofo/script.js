/* ── Screen management ──────────────────────────── */
const screens = ['s1','s2','s3'].map(id => document.getElementById(id));
function goTo(n) {
  screens.forEach((s, i) => s.classList.toggle('active', i === n));
}

/* ── TELA 1: NÃO impossível ─────────────────────── */
const yesBtn = document.getElementById('yesBtn');
const noBtn  = document.getElementById('noBtn');
const hint   = document.getElementById('hint');
const arena  = document.getElementById('arena');

const msgs = [
  'Ops! O NÃO saiu correndo! 😂',
  'Ele tem pernas, sabia? 🦵💨',
  'Achou que ia pegar? Que inocente… 😏',
  'O NÃO entrou em modo pânico! 🚨',
  'Tá mais rápido que você! 🏃‍♂️💅',
  'Esse botão foi treinado pra fugir! 🥷',
  'Nem o Flash pegaria esse NÃO! ⚡',
  'Spoiler: o NÃO nunca vai ser clicado 🙃',
  'Curiosidade: o SIM é bem mansinho… 🥺',
  'O NÃO pediu demissão. Clica no SIM! 💀',
];

let tries = 0;

function initBtn() {
  const aw = arena.offsetWidth;
  const ah = arena.offsetHeight;
  const bw = noBtn.offsetWidth;
  const bh = noBtn.offsetHeight;
  noBtn.style.transition = 'none';
  noBtn.style.transform  = 'none';
  noBtn.style.left = ((aw - bw) / 2) + 'px';
  noBtn.style.top  = ((ah - bh) / 2) + 'px';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    noBtn.style.transition =
      'left 0.13s cubic-bezier(0.34,1.56,0.64,1), top 0.13s cubic-bezier(0.34,1.56,0.64,1)';
  }));
}

window.addEventListener('load', initBtn);

function escapeFrom(mx, my) {
  const aRect = arena.getBoundingClientRect();
  const bRect = noBtn.getBoundingClientRect();
  const bCX   = bRect.left + bRect.width  / 2;
  const bCY   = bRect.top  + bRect.height / 2;

  if (Math.hypot(bCX - mx, bCY - my) > 160) return;

  const pad = 8;
  const maxL = aRect.width  - bRect.width  - pad;
  const maxT = aRect.height - bRect.height - pad;

  let bestL = pad, bestT = pad, bestD = 0;
  for (let i = 0; i < 12; i++) {
    const l = pad + Math.random() * maxL;
    const t = pad + Math.random() * maxT;
    const d = Math.hypot((aRect.left + l + bRect.width/2)  - mx,
                         (aRect.top  + t + bRect.height/2) - my);
    if (d > bestD) { bestD = d; bestL = l; bestT = t; }
  }

  noBtn.style.left = bestL + 'px';
  noBtn.style.top  = bestT + 'px';

  hint.textContent = msgs[tries % msgs.length];
  tries++;
}

document.addEventListener('mousemove', e => escapeFrom(e.clientX, e.clientY));
document.addEventListener('touchmove',  e => {
  escapeFrom(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
document.addEventListener('touchstart', e => {
  escapeFrom(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

noBtn.addEventListener('click',    e => { e.preventDefault(); e.stopImmediatePropagation(); escapeFrom(e.clientX, e.clientY); });
noBtn.addEventListener('touchend', e => { e.preventDefault(); e.stopImmediatePropagation(); });

yesBtn.addEventListener('click', () => {
  hint.textContent = 'Eu sabia que você diria SIM! ❤️';
  hint.classList.add('hint-sim');
  setTimeout(() => {
    hint.classList.remove('hint-sim');
    hint.textContent = 'Escolha com cuidado…';
    goTo(1);
  }, 1400);
});

/* ── TELA 2: Caixas ─────────────────────────────── */
const SPECIAL = Math.floor(Math.random() * 3);
let picked = false;

document.querySelectorAll('.gift-box').forEach(box => {
  box.addEventListener('click', () => {
    if (picked) return;
    box.classList.add('shake');
    setTimeout(() => {
      box.classList.remove('shake');
      box.classList.add('opening');
      picked = true;
      setTimeout(() => {
        const i = +box.dataset.i;
        if (i === SPECIAL) showSpecial();
        else showGem();
      }, 650);
    }, 350);
  });
});

/* ── Revelar: Joia Azul ────────────────────────── */
function showGem() {
  const card = document.getElementById('revealCard');
  card.className = 'card reveal-gem';
  card.innerHTML = `
    <div class="gem-wrap">
      <span class="gem-emoji">💎</span>
      ${[0,60,120,180,240,300].map((rot, i) =>
        `<span class="sparkle" style="--rot:${rot}deg;--delay:${(i*0.3).toFixed(1)}s">✨</span>`
      ).join('')}
    </div>
    <h2>Joia Azul! 💙</h2>
    <p class="hint">Uma pedra preciosa… mas existe algo ainda mais especial!</p>
    <button class="btn-try" id="tryBtn">Tentar outra caixa 🎁</button>
  `;
  goTo(2);
  document.getElementById('tryBtn').addEventListener('click', resetBoxes);
}

/* ── Revelar: Mensagem especial + flor ─────────── */
function showSpecial() {
  const card = document.getElementById('revealCard');
  card.className = 'card reveal-special';

  const petals = Array.from({length: 8}, (_, i) =>
    `<div class="petal" style="--i:${i}"></div>`
  ).join('');

  const hearts = Array.from({length: 14}, (_, i) =>
    `<span class="heart" style="--x:${4 + i * 7}%;--delay:${(i * 0.22).toFixed(2)}s">💗</span>`
  ).join('');

  card.innerHTML = `
    <div class="flower-wrap">
      <div class="flower">
        ${petals}
        <div class="flower-center"></div>
        <div class="flower-stem"></div>
      </div>
    </div>
    <div class="special-msg">
      <h2 class="glow-text">Você é a mulher mais<br>linda do mundo 🌸</h2>
      <p class="sub-msg">…este segredo estava guardado<br>especialmente para você 💕</p>
    </div>
    <button class="btn-try" id="tryBtn" style="margin-top:20px">Ver outra caixinha 🎁</button>
    <div class="hearts">${hearts}</div>
  `;
  goTo(2);
  document.getElementById('tryBtn').addEventListener('click', resetBoxes);
}

/* ── Reset caixas ───────────────────────────────── */
function resetBoxes() {
  picked = false;
  document.querySelectorAll('.gift-box').forEach(b =>
    b.classList.remove('shake', 'opening')
  );
  goTo(1);
}
