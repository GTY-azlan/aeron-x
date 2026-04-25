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
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050810);
scene.fog = new THREE.FogExp2(0x050810, 0.025);

// PMREMGenerator + RoomEnvironment for realistic reflections
const pmrem = new THREE.PMREMGenerator(renderer);
const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTexture;
pmrem.dispose();

// ── Camera ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(5.5, 1.8, 5.5);

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
scene.add(new THREE.AmbientLight(0xd0e8ff, 0.4));
scene.add(new THREE.HemisphereLight(0x1a2a4a, 0x050810, 0.9));

const sun = new THREE.DirectionalLight(0xfff8f0, 2.2);
sun.position.set(8, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
sun.shadow.camera.left = sun.shadow.camera.bottom = -10;
sun.shadow.camera.right = sun.shadow.camera.top = 10;
sun.shadow.bias = -0.001;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x3e9bff, 0.7);
fill.position.set(-8, 4, -6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.5);
rim.position.set(0, 3, -9);
scene.add(rim);

// ── Ground ────────────────────────────────────────────────────────────────────
const groundMat = new THREE.MeshStandardMaterial({ color: 0x080c14, roughness: 0.35, metalness: 0.7, envMap: envTexture });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.95; ground.receiveShadow = true;
scene.add(ground);
const gridHelper = new THREE.GridHelper(40, 40, 0x0d1a2e, 0x0a1020);
gridHelper.position.y = -0.94;
scene.add(gridHelper);

// Reflection plane
const reflMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1a, roughness: 0.04, metalness: 0.95, transparent: true, opacity: 0.55, envMap: envTexture });
const refl = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), reflMat);
refl.rotation.x = -Math.PI / 2; refl.position.y = -0.93;
scene.add(refl);

// ── Model Y builder ───────────────────────────────────────────────────────────
let bodyMat, wheelMeshes = [], lightMeshes = [], glassMeshes = [];

function pbr(color, rough = 0.2, metal = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, envMap: envTexture, envMapIntensity: 1.2, ...extra });
}

function buildModelY(bodyColor = 0x1a1a1a) {
  const g = new THREE.Group();
  wheelMeshes = []; lightMeshes = []; glassMeshes = [];
  bodyMat = pbr(bodyColor, 0.12, 0.88);

  const add = (geo, mat, pos, rot, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    g.add(m); return m;
  };

  // Body
  add(new THREE.BoxGeometry(4.7, 0.62, 2.0), bodyMat, [0, 0.05, 0]);
  add(new THREE.BoxGeometry(2.9, 0.72, 1.88), bodyMat, [-0.1, 0.68, 0]);
  add(new THREE.BoxGeometry(2.4, 0.12, 1.82), bodyMat, [-0.15, 1.08, 0]);
  add(new THREE.BoxGeometry(1.6, 0.18, 1.95), bodyMat, [1.45, 0.38, 0], [0, 0, -0.1]);
  add(new THREE.BoxGeometry(1.0, 0.22, 1.9),  bodyMat, [-1.65, 0.55, 0], [0, 0, 0.22]);

  // Glass
  const glassMat = pbr(0x0a1a2a, 0.04, 0.08, { transparent: true, opacity: 0.5 });
  const glassRoof = add(new THREE.BoxGeometry(2.1, 0.06, 1.7), glassMat, [-0.15, 1.1, 0], null, false);
  const windF = add(new THREE.BoxGeometry(0.05, 0.66, 1.78), glassMat, [1.3, 0.72, 0], [0, 0, -0.42], false);
  const windR = add(new THREE.BoxGeometry(0.05, 0.66, 1.78), glassMat, [-1.55, 0.72, 0], [0, 0, 0.42], false);
  glassMeshes.push(glassRoof, windF, windR);
  [0.25, -0.35].forEach(x => {
    [-1, 1].forEach(side => {
      const sw = add(new THREE.BoxGeometry(0.6, 0.42, 0.04), glassMat, [x, 0.78, side * 0.95], null, false);
      glassMeshes.push(sw);
    });
  });

  // Wheels
  const tyreMat  = pbr(0x111111, 0.95, 0.05);
  const rimMat   = pbr(0xcccccc, 0.08, 0.97);
  const brakeMat = pbr(0xe82127, 0.5, 0.3);
  [[1.35, -0.38, 1.05], [1.35, -0.38, -1.05], [-1.35, -0.38, 1.05], [-1.35, -0.38, -1.05]].forEach(([x, y, z]) => {
    const tyre = add(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 32), tyreMat, [x, y, z], [0, 0, Math.PI / 2]);
    const rim2 = add(new THREE.CylinderGeometry(0.3, 0.3, 0.32, 10), rimMat, [x, y, z], [0, 0, Math.PI / 2]);
    wheelMeshes.push(tyre, rim2);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = add(new THREE.BoxGeometry(0.38, 0.05, 0.05), rimMat, [x, y + Math.sin(a) * 0.16, z + Math.cos(a) * 0.16], [0, 0, Math.PI / 2]);
      wheelMeshes.push(sp);
    }
    add(new THREE.BoxGeometry(0.08, 0.2, 0.38), brakeMat, [x, y + 0.24, z]);
  });

  // Headlights
  const drlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
  [-0.6, 0.6].forEach(z => {
    const drl  = add(new THREE.BoxGeometry(0.05, 0.05, 0.55), drlMat, [2.38, 0.28, z], null, false);
    const lens = add(new THREE.BoxGeometry(0.07, 0.22, 0.44), pbr(0xaaccff, 0.04, 0.1, { transparent: true, opacity: 0.7 }), [2.36, 0.18, z], null, false);
    lightMeshes.push(drl, lens);
  });

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 1.0 });
  const tailBar = add(new THREE.BoxGeometry(0.05, 0.06, 1.85), tailMat, [-2.38, 0.3, 0], null, false);
  lightMeshes.push(tailBar);

  // Details
  add(new THREE.BoxGeometry(0.1, 0.28, 1.6), pbr(0x0a0a0a, 0.7, 0.2), [2.38, 0.05, 0]);
  const handleMat = pbr(0x888888, 0.15, 0.95);
  [0.6, -0.3].forEach(x => [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.28, 0.04, 0.04), handleMat, [x, 0.52, s * 1.01])));
  [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.22, 0.1, 0.08), pbr(bodyColor, 0.2, 0.8), [1.55, 0.72, s * 1.02]));

  g.position.y = 0.5;
  return g;
}

let car = buildModelY(window.INITIAL_CAR_COLOR ?? 0x1a1a1a);
scene.add(car);

// ── Loading screen ────────────────────────────────────────────────────────────
const loader = document.getElementById('loader');
setTimeout(() => gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.classList.add('hidden') }), 800);

// ── Color picker ──────────────────────────────────────────────────────────────
document.querySelectorAll('.color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('colorName').textContent = btn.dataset.name;
    const target = new THREE.Color(btn.dataset.hex);
    gsap.to(bodyMat.color, { r: target.r, g: target.g, b: target.b, duration: 0.6, ease: 'power2.out' });
  });
});

// ── Camera presets with GSAP ──────────────────────────────────────────────────
const VIEW_CONTEXT = {
  default:  null,
  front:    { title: 'Front Fascia', desc: 'Aerodynamic front with full-width LED DRL strips and a sealed lower grille for maximum efficiency.' },
  side:     { title: 'Side Profile', desc: 'Flush door handles, panoramic glass roof, and 20" Induction wheels define the Model Y silhouette.' },
  rear:     { title: 'Rear Design', desc: 'Full-width tail light bar and integrated spoiler. Dual motor AWD badge on Performance variants.' },
  top:      { title: 'Panoramic Roof', desc: 'The largest glass roof in any Tesla — UV and infrared protected, with an open, airy cabin feel.' },
  interior: { title: 'Interior View', desc: '16" central touchscreen, minimalist dash, vegan leather seats, and a 15-speaker premium audio system.' },
};

const PRESETS = {
  default:  { pos: [5.5, 1.8, 5.5],   tgt: [0, 0.4, 0] },
  front:    { pos: [0, 1.0, 6.5],     tgt: [0, 0.3, 0] },
  side:     { pos: [8.5, 1.2, 0],     tgt: [0, 0.4, 0] },
  rear:     { pos: [0, 1.0, -6.5],    tgt: [0, 0.3, 0] },
  top:      { pos: [0, 9.5, 0.01],    tgt: [0, 0, 0]   },
  interior: { pos: [0.5, 0.9, 1.2],   tgt: [0, 0.7, 0] },
};

function goToPreset(name) {
  const p = PRESETS[name];
  const side = document.querySelector('.canvas-side');
  side.classList.add('transitioning');

  gsap.to(camera.position, {
    x: p.pos[0], y: p.pos[1], z: p.pos[2],
    duration: 1.2, ease: 'power3.inOut',
    onComplete: () => side.classList.remove('transitioning')
  });
  gsap.to(controls.target, {
    x: p.tgt[0], y: p.tgt[1], z: p.tgt[2],
    duration: 1.2, ease: 'power3.inOut'
  });

  // Update view context panel
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

// ── Part highlighting ─────────────────────────────────────────────────────────
const PART_GROUPS = { wheels: wheelMeshes, lights: lightMeshes, glass: glassMeshes };
let highlightedMats = [];

function clearHighlight() {
  highlightedMats.forEach(({ mat, orig }) => { mat.emissive.set(orig); mat.emissiveIntensity = mat._origIntensity || 0; });
  highlightedMats = [];
}

function highlightPart(name) {
  clearHighlight();
  if (name === 'none' || !PART_GROUPS[name]) return;
  PART_GROUPS[name].forEach(mesh => {
    const mat = mesh.material;
    if (!mat || mat.emissive === undefined) return;
    mat._origIntensity = mat.emissiveIntensity;
    const orig = mat.emissive.clone();
    highlightedMats.push({ mat, orig });
    gsap.to(mat.emissive, { r: 0.24, g: 0.6, b: 1.0, duration: 0.4 });
    gsap.to(mat, { emissiveIntensity: 0.5, duration: 0.4 });
  });
}

document.querySelectorAll('.part-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
    if (!isActive && btn.dataset.part !== 'none') {
      btn.classList.add('active');
      highlightPart(btn.dataset.part);
    } else {
      clearHighlight();
    }
  });
});

// ── Auto-rotation + idle detection ───────────────────────────────────────────
let autoRotate = true;
let idleTimer = null;
const badge = document.getElementById('autoRotateBadge');
const IDLE_DELAY = 4000; // ms before auto-rotate resumes

function startAutoRotate() {
  autoRotate = true;
  badge.classList.add('visible');
}
function stopAutoRotate() {
  autoRotate = false;
  badge.classList.remove('visible');
  clearTimeout(idleTimer);
}
function resetIdle() {
  stopAutoRotate();
  idleTimer = setTimeout(startAutoRotate, IDLE_DELAY);
}

// Start auto-rotating after initial load
setTimeout(startAutoRotate, 1200);

// Stop on any interaction
['mousedown', 'touchstart', 'wheel'].forEach(evt =>
  canvas.addEventListener(evt, resetIdle, { passive: true })
);
controls.addEventListener('start', resetIdle);

// ── Fullscreen ────────────────────────────────────────────────────────────────
const fsBtn = document.getElementById('fullscreenBtn');
const fsIcon = document.getElementById('fsIcon');
const exitD  = 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3';
const enterD = 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3';
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fsIcon.querySelector('path').setAttribute('d', exitD);
  } else {
    document.exitFullscreen();
    fsIcon.querySelector('path').setAttribute('d', enterD);
  }
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

// ── Render loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
(function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();

  if (autoRotate) controls.autoRotate = true, controls.autoRotateSpeed = 0.6;
  else controls.autoRotate = false;

  // Gentle float
  car.position.y = 0.5 + Math.sin(t * 0.7) * 0.022;

  controls.update();
  renderer.render(scene, camera);
})();
