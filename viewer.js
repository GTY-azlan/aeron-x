import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const gsap = window.gsap;

// ── Renderer ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03060f);
scene.fog = new THREE.FogExp2(0x03060f, 0.018);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTexture;
pmrem.dispose();

// ── Camera ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
// Start far away for cinematic fly-in
camera.position.set(18, 6, 18);

// ── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 2.5;
controls.maxDistance = 13;
controls.maxPolarAngle = Math.PI / 2 + 0.08;
controls.minPolarAngle = 0.1;
controls.enablePan = true;
controls.panSpeed = 0.6;
controls.target.set(0, 0.4, 0);
controls.update();

// ── Lighting ──────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xd0e8ff, 0.2));
scene.add(new THREE.HemisphereLight(0x1a2a4a, 0x03060f, 0.6));

const sun = new THREE.DirectionalLight(0xfff4e0, 3.2);
sun.position.set(8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
sun.shadow.camera.left = sun.shadow.camera.bottom = -10;
sun.shadow.camera.right = sun.shadow.camera.top = 10;
sun.shadow.bias = -0.001;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x3e9bff, 1.1);
fill.position.set(-8, 4, -6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffe8c0, 0.9);
rim.position.set(0, 3, -9);
scene.add(rim);

// Underglow point light (color-changeable)
const underglow = new THREE.PointLight(0x1a3a6a, 0, 5);
underglow.position.set(0, -0.7, 0);
scene.add(underglow);

// Headlight spot lights (off by default, toggled)
const headlightL = new THREE.SpotLight(0xffffff, 0, 20, Math.PI / 8, 0.3, 1.5);
headlightL.position.set(2.5, 0.3, 1.0);
headlightL.target.position.set(8, -0.5, 1.0);
scene.add(headlightL); scene.add(headlightL.target);

const headlightR = new THREE.SpotLight(0xffffff, 0, 20, Math.PI / 8, 0.3, 1.5);
headlightR.position.set(2.5, 0.3, -1.0);
headlightR.target.position.set(8, -0.5, -1.0);
scene.add(headlightR); scene.add(headlightR.target);

// ── Ground ────────────────────────────────────────────────────────────────────
const groundMat = new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 0.22, metalness: 0.88, envMap: envTexture });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.95; ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(40, 40, 0x0d1a2e, 0x080f1c);
gridHelper.position.y = -0.94;
scene.add(gridHelper);

const reflMat = new THREE.MeshStandardMaterial({ color: 0x060c18, roughness: 0.02, metalness: 0.98, transparent: true, opacity: 0.7, envMap: envTexture });
const refl = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), reflMat);
refl.rotation.x = -Math.PI / 2; refl.position.y = -0.93;
scene.add(refl);

// ── Helpers ───────────────────────────────────────────────────────────────────
function pbr(color, rough = 0.2, metal = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, envMap: envTexture, envMapIntensity: 1.6, ...extra });
}

// ── Car State ─────────────────────────────────────────────────────────────────
let bodyMat, wheelMeshes = [], lightMeshes = [], glassMeshes = [];
let doorFL, doorFR, doorRL, doorRR, hoodGroup;
let doorsOpen = false, lightsOn = false, wheelSpinning = false;
let drlMat, tailMat;

// ── Build Car ─────────────────────────────────────────────────────────────────
function buildModelY(bodyColor = 0x1a1a1a) {
  const g = new THREE.Group();
  wheelMeshes = []; lightMeshes = []; glassMeshes = [];
  bodyMat = pbr(bodyColor, 0.08, 0.92);

  const mesh = (geo, mat, px, py, pz, rx = 0, ry = 0, rz = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  };
  const add = (geo, mat, px, py, pz, rx, ry, rz, shadow) => {
    const m = mesh(geo, mat, px, py, pz, rx, ry, rz, shadow);
    g.add(m); return m;
  };

  // ── Body panels ──
  add(new THREE.BoxGeometry(4.7, 0.62, 2.0),  bodyMat, 0, 0.05, 0);
  add(new THREE.BoxGeometry(2.9, 0.72, 1.88), bodyMat, -0.1, 0.68, 0);
  add(new THREE.BoxGeometry(2.4, 0.12, 1.82), bodyMat, -0.15, 1.08, 0);
  add(new THREE.BoxGeometry(1.6, 0.18, 1.95), bodyMat, 1.45, 0.38, 0, 0, 0, -0.1);
  add(new THREE.BoxGeometry(1.0, 0.22, 1.9),  bodyMat, -1.65, 0.55, 0, 0, 0, 0.22);

  // ── Glass ──
  const glassMat = pbr(0x0a1a2a, 0.04, 0.08, { transparent: true, opacity: 0.5 });
  const glassRoof = mesh(new THREE.BoxGeometry(2.1, 0.06, 1.7), glassMat, -0.15, 1.1, 0);
  glassRoof.castShadow = false;
  g.add(glassRoof); glassMeshes.push(glassRoof);
  const windF = mesh(new THREE.BoxGeometry(0.05, 0.66, 1.78), glassMat, 1.3, 0.72, 0, 0, 0, -0.42);
  windF.castShadow = false; g.add(windF); glassMeshes.push(windF);
  const windR = mesh(new THREE.BoxGeometry(0.05, 0.66, 1.78), glassMat, -1.55, 0.72, 0, 0, 0, 0.42);
  windR.castShadow = false; g.add(windR); glassMeshes.push(windR);

  // ── Doors (as pivot groups so they can swing open) ──
  const makeDoor = (px, py, pz, side) => {
    const dg = new THREE.Group();
    dg.position.set(px, py, pz);
    // pivot at hinge edge
    const panel = mesh(new THREE.BoxGeometry(1.1, 0.72, 0.06), bodyMat, 0, 0, side * 0.55);
    const win   = mesh(new THREE.BoxGeometry(0.9, 0.38, 0.04), glassMat, 0, 0.42, side * 0.55);
    win.castShadow = false;
    const handle = mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), pbr(0x888888, 0.15, 0.95), 0.1, 0.05, side * 0.58);
    dg.add(panel, win, handle);
    glassMeshes.push(win);
    g.add(dg);
    return dg;
  };

  doorFL = makeDoor( 0.55, 0.52,  1.0,  1);
  doorFR = makeDoor( 0.55, 0.52, -1.0, -1);
  doorRL = makeDoor(-0.45, 0.52,  1.0,  1);
  doorRR = makeDoor(-0.45, 0.52, -1.0, -1);

  // ── Hood group (pivots at front) ──
  hoodGroup = new THREE.Group();
  hoodGroup.position.set(1.8, 0.38, 0);
  const hoodPanel = mesh(new THREE.BoxGeometry(1.5, 0.08, 1.9), bodyMat, -0.15, 0, 0);
  hoodGroup.add(hoodPanel);
  g.add(hoodGroup);

  // ── Wheels ──
  const tyreMat = pbr(0x111111, 0.95, 0.05);
  const rimMat  = pbr(0xcccccc, 0.08, 0.97);
  const brakeMat = pbr(0xe82127, 0.5, 0.3);
  [[1.35, -0.38, 1.05], [1.35, -0.38, -1.05], [-1.35, -0.38, 1.05], [-1.35, -0.38, -1.05]].forEach(([x, y, z]) => {
    const tyre = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 32), tyreMat, x, y, z, 0, 0, Math.PI / 2);
    const rim2 = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.32, 10), rimMat, x, y, z, 0, 0, Math.PI / 2);
    g.add(tyre, rim2);
    wheelMeshes.push(tyre, rim2);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = mesh(new THREE.BoxGeometry(0.38, 0.05, 0.05), rimMat, x, y + Math.sin(a) * 0.16, z + Math.cos(a) * 0.16, 0, 0, Math.PI / 2);
      g.add(sp); wheelMeshes.push(sp);
    }
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.2, 0.38), brakeMat, x, y + 0.24, z));
  });

  // ── Headlights ──
  drlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.5 });
  [-0.6, 0.6].forEach(z => {
    const drl  = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), drlMat, 2.38, 0.28, z);
    drl.castShadow = false;
    const lens = mesh(new THREE.BoxGeometry(0.07, 0.22, 0.44), pbr(0xaaccff, 0.04, 0.1, { transparent: true, opacity: 0.7 }), 2.36, 0.18, z);
    lens.castShadow = false;
    g.add(drl, lens);
    lightMeshes.push(drl, lens);
  });

  // ── Taillights ──
  tailMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 1.2 });
  const tailBar = mesh(new THREE.BoxGeometry(0.05, 0.06, 1.85), tailMat, -2.38, 0.3, 0);
  tailBar.castShadow = false;
  g.add(tailBar); lightMeshes.push(tailBar);

  // ── Details ──
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.28, 1.6), pbr(0x0a0a0a, 0.7, 0.2), 2.38, 0.05, 0));
  [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), pbr(bodyColor, 0.2, 0.8), 1.55, 0.72, s * 1.02)));

  g.position.y = 0.5;
  return g;
}

let car = buildModelY(window.INITIAL_CAR_COLOR ?? 0x1a1a1a);
scene.add(car);

// ── Exhaust Particles ─────────────────────────────────────────────────────────
const PARTICLE_COUNT = 60;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PARTICLE_COUNT * 3);
const pVel = [];
for (let i = 0; i < PARTICLE_COUNT; i++) {
  pPos[i * 3] = -2.4; pPos[i * 3 + 1] = -0.3; pPos[i * 3 + 2] = 0;
  pVel.push({ x: (Math.random() - 0.5) * 0.02, y: Math.random() * 0.015, z: (Math.random() - 0.5) * 0.02, life: Math.random() });
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0x8899aa, size: 0.06, transparent: true, opacity: 0.35, depthWrite: false });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ── Cinematic Fly-In ──────────────────────────────────────────────────────────
const loader = document.getElementById('loader');
car.position.y = -4;
car.scale.set(0.8, 0.8, 0.8);

setTimeout(() => {
  gsap.to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.classList.add('hidden') });
  // Car rises up
  gsap.to(car.position, { y: 0.5, duration: 1.5, ease: 'power3.out', delay: 0.1 });
  gsap.to(car.scale,    { x: 1, y: 1, z: 1, duration: 1.3, ease: 'power3.out', delay: 0.1 });
  // Camera flies in from far
  gsap.to(camera.position, { x: 5.5, y: 1.8, z: 5.5, duration: 2.2, ease: 'power2.inOut', delay: 0.2 });
  // Lights pulse on after car appears
  setTimeout(() => triggerLightsOn(), 1800);
}, 800);

function triggerLightsOn() {
  // DRL flash sequence
  gsap.to(drlMat, { emissiveIntensity: 8, duration: 0.08, yoyo: true, repeat: 3,
    onComplete: () => { drlMat.emissiveIntensity = 3.5; }
  });
  gsap.to(tailMat, { emissiveIntensity: 4, duration: 0.08, yoyo: true, repeat: 3,
    onComplete: () => { tailMat.emissiveIntensity = 1.2; }
  });
}

// ── Door Animation ────────────────────────────────────────────────────────────
function toggleDoors() {
  doorsOpen = !doorsOpen;
  const angle = doorsOpen ? Math.PI / 3 : 0;
  const dur = 0.9, ease = 'power2.inOut';
  gsap.to(doorFL.rotation, { y:  angle, duration: dur, ease });
  gsap.to(doorFR.rotation, { y: -angle, duration: dur, ease, delay: 0.08 });
  gsap.to(doorRL.rotation, { y:  angle, duration: dur, ease, delay: 0.16 });
  gsap.to(doorRR.rotation, { y: -angle, duration: dur, ease, delay: 0.24 });
  // Play door sound
  if (window.SFX) window.SFX.door();
  // Update button label
  const btn = document.getElementById('doorBtn');
  if (btn) btn.textContent = doorsOpen ? '🚪 Close Doors' : '🚪 Open Doors';
}

// ── Hood Animation ────────────────────────────────────────────────────────────
let hoodOpen = false;
function toggleHood() {
  hoodOpen = !hoodOpen;
  gsap.to(hoodGroup.rotation, { z: hoodOpen ? -0.7 : 0, duration: 0.8, ease: 'power2.inOut' });
  const btn = document.getElementById('hoodBtn');
  if (btn) btn.textContent = hoodOpen ? '🔧 Close Hood' : '🔧 Open Hood';
}

// ── Headlights Toggle ─────────────────────────────────────────────────────────
function toggleLights() {
  lightsOn = !lightsOn;
  const intensity = lightsOn ? 12 : 0;
  gsap.to(headlightL, { intensity, duration: 0.3 });
  gsap.to(headlightR, { intensity, duration: 0.3 });
  gsap.to(drlMat, { emissiveIntensity: lightsOn ? 6 : 3.5, duration: 0.3 });
  gsap.to(tailMat, { emissiveIntensity: lightsOn ? 3 : 1.2, duration: 0.3 });
  // Darken scene slightly for drama
  gsap.to(renderer, { toneMappingExposure: lightsOn ? 0.9 : 1.4, duration: 0.5 });
  const btn = document.getElementById('lightsBtn');
  if (btn) btn.textContent = lightsOn ? '💡 Lights Off' : '💡 Lights On';
  if (window.SFX) window.SFX.click();
}

// ── Underglow ─────────────────────────────────────────────────────────────────
const UNDERGLOW_COLORS = {
  off:    { hex: null,     int: 0 },
  blue:   { hex: 0x0044ff, int: 2.5 },
  purple: { hex: 0x8800ff, int: 2.5 },
  red:    { hex: 0xff1100, int: 2.5 },
  green:  { hex: 0x00ff44, int: 2.5 },
  white:  { hex: 0xffffff, int: 1.5 },
};
function setUnderglow(name) {
  const c = UNDERGLOW_COLORS[name] || UNDERGLOW_COLORS.off;
  if (c.hex !== null) underglow.color.set(c.hex);
  gsap.to(underglow, { intensity: c.int, duration: 0.5 });
  document.querySelectorAll('.underglow-btn').forEach(b => b.classList.toggle('active', b.dataset.glow === name));
}

// ── Wheel Spin Toggle ─────────────────────────────────────────────────────────
function toggleWheelSpin() {
  wheelSpinning = !wheelSpinning;
  const btn = document.getElementById('wheelBtn');
  if (btn) btn.textContent = wheelSpinning ? '⚙️ Stop Spin' : '⚙️ Spin Wheels';
}

// ── Wire up panel buttons ─────────────────────────────────────────────────────
document.getElementById('doorBtn')?.addEventListener('click',  () => { toggleDoors(); resetIdle(); });
document.getElementById('hoodBtn')?.addEventListener('click',  () => { toggleHood();  resetIdle(); });
document.getElementById('lightsBtn')?.addEventListener('click',() => { toggleLights(); resetIdle(); });
document.getElementById('wheelBtn')?.addEventListener('click', () => { toggleWheelSpin(); resetIdle(); });
document.querySelectorAll('.underglow-btn').forEach(btn =>
  btn.addEventListener('click', () => { setUnderglow(btn.dataset.glow); resetIdle(); })
);

// ── Color Picker ──────────────────────────────────────────────────────────────
document.querySelectorAll('.color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('colorName').textContent = btn.dataset.name;
    const target = new THREE.Color(btn.dataset.hex);
    gsap.to(renderer, { toneMappingExposure: 1.9, duration: 0.12, yoyo: true, repeat: 1 });
    gsap.to(bodyMat.color, { r: target.r, g: target.g, b: target.b, duration: 0.7, ease: 'power2.out' });
    if (window.SFX) window.SFX.click();
  });
});

// ── Camera Presets ────────────────────────────────────────────────────────────
const VIEW_CONTEXT = {
  default:  null,
  front:    { title: 'Front Fascia',    desc: 'Full-width LED DRL strips and sealed lower grille for maximum aerodynamic efficiency.' },
  side:     { title: 'Side Profile',    desc: 'Flush door handles, panoramic glass roof, and 20" Induction wheels.' },
  rear:     { title: 'Rear Design',     desc: 'Full-width tail light bar and integrated spoiler. Dual motor AWD.' },
  top:      { title: 'Panoramic Roof',  desc: 'The largest glass roof in any Tesla — UV and infrared protected.' },
  interior: { title: 'Interior View',   desc: '16" touchscreen, minimalist dash, vegan leather, 15-speaker audio.' },
};
const PRESETS = {
  default:  { pos: [5.5, 1.8, 5.5],  tgt: [0, 0.4, 0] },
  front:    { pos: [0, 1.0, 6.5],    tgt: [0, 0.3, 0] },
  side:     { pos: [8.5, 1.2, 0],    tgt: [0, 0.4, 0] },
  rear:     { pos: [0, 1.0, -6.5],   tgt: [0, 0.3, 0] },
  top:      { pos: [0, 9.5, 0.01],   tgt: [0, 0, 0]   },
  interior: { pos: [0.5, 0.9, 1.2],  tgt: [0, 0.7, 0] },
};

function goToPreset(name) {
  const p = PRESETS[name];
  gsap.to(camera.position, { x: p.pos[0], y: p.pos[1], z: p.pos[2], duration: 1.3, ease: 'power3.inOut' });
  gsap.to(controls.target, { x: p.tgt[0], y: p.tgt[1], z: p.tgt[2], duration: 1.3, ease: 'power3.inOut' });
  const ctx = VIEW_CONTEXT[name];
  const panel = document.getElementById('viewContext');
  if (ctx) {
    panel.innerHTML = `<strong>${ctx.title}</strong>${ctx.desc}`;
    gsap.fromTo(panel, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4 });
  } else {
    gsap.to(panel, { opacity: 0, duration: 0.3, onComplete: () => { panel.innerHTML = ''; } });
  }
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    goToPreset(btn.dataset.preset);
    resetIdle();
  });
});

// ── Part Highlighting ─────────────────────────────────────────────────────────
const PART_GROUPS = { wheels: wheelMeshes, lights: lightMeshes, glass: glassMeshes };
let highlightedMats = [];

function clearHighlight() {
  highlightedMats.forEach(({ mat, orig, origI }) => { mat.emissive.set(orig); mat.emissiveIntensity = origI; });
  highlightedMats = [];
}
function highlightPart(name) {
  clearHighlight();
  if (name === 'none' || !PART_GROUPS[name]) return;
  PART_GROUPS[name].forEach(mesh => {
    const mat = mesh.material;
    if (!mat?.emissive) return;
    highlightedMats.push({ mat, orig: mat.emissive.clone(), origI: mat.emissiveIntensity });
    gsap.to(mat.emissive, { r: 0.24, g: 0.6, b: 1.0, duration: 0.4 });
    gsap.to(mat, { emissiveIntensity: 0.6, duration: 0.4 });
  });
}
document.querySelectorAll('.part-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
    if (!isActive && btn.dataset.part !== 'none') { btn.classList.add('active'); highlightPart(btn.dataset.part); }
    else clearHighlight();
  });
});

// ── Auto-Rotate + Idle ────────────────────────────────────────────────────────
let autoRotate = false, idleTimer = null;
const badge = document.getElementById('autoRotateBadge');

function startAutoRotate() { autoRotate = true;  badge.classList.add('visible'); }
function stopAutoRotate()  { autoRotate = false; badge.classList.remove('visible'); clearTimeout(idleTimer); }
function resetIdle() { stopAutoRotate(); idleTimer = setTimeout(startAutoRotate, 4000); }

setTimeout(startAutoRotate, 2800);
['mousedown', 'touchstart', 'wheel'].forEach(e => canvas.addEventListener(e, resetIdle, { passive: true }));
controls.addEventListener('start', resetIdle);

// ── Fullscreen ────────────────────────────────────────────────────────────────
const fsBtn = document.getElementById('fullscreenBtn');
const fsIcon = document.getElementById('fsIcon');
const exitD  = 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3';
const enterD = 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3';
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); fsIcon.querySelector('path').setAttribute('d', exitD); }
  else { document.exitFullscreen(); fsIcon.querySelector('path').setAttribute('d', enterD); }
});

// ── Resize ────────────────────────────────────────────────────────────────────
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ── Render Loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let wheelAngle = 0;

(function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  const dt = clock.getDelta ? 0.016 : 0.016;

  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 0.5;

  // Float
  car.position.y = 0.5 + Math.sin(t * 0.7) * 0.022;

  // Dynamic sun orbit for live reflections
  sun.position.x = 8 + Math.sin(t * 0.1) * 2;
  sun.position.z = 6 + Math.cos(t * 0.1) * 2;

  // Wheel spin
  if (wheelSpinning) {
    wheelAngle += 0.08;
    wheelMeshes.forEach(m => { m.rotation.x = wheelAngle; });
  }

  // Exhaust particles
  const pos = pGeo.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pVel[i].life += 0.012;
    if (pVel[i].life > 1) {
      pVel[i].life = 0;
      pos[i*3]   = -2.4 + (Math.random()-0.5)*0.1;
      pos[i*3+1] = -0.3;
      pos[i*3+2] = (Math.random()-0.5)*0.3;
      pVel[i].x = (Math.random()-0.5)*0.02;
      pVel[i].y = Math.random()*0.015;
      pVel[i].z = (Math.random()-0.5)*0.02;
    }
    pos[i*3]   += pVel[i].x - 0.025;
    pos[i*3+1] += pVel[i].y;
    pos[i*3+2] += pVel[i].z;
  }
  pGeo.attributes.position.needsUpdate = true;
  pMat.opacity = 0.25 + Math.sin(t * 2) * 0.05;

  controls.update();
  renderer.render(scene, camera);
})();
