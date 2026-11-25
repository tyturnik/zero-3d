/* 3D-сцена на Three.js r128: чашка, пар, зёрна, барабан обжарки, метка на карте.
   Читает window.ZERNO (target, roast, loc) из js/app.js. */
if (window.THREE && window.ZERNO) { try {
const T = THREE, state = window.ZERNO, cv = document.getElementById('gl');
const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.outputEncoding = T.sRGBEncoding;
R.toneMapping = T.ACESFilmicToneMapping;
R.toneMappingExposure = 1.05;

const S = new T.Scene();
S.fog = new T.Fog(0x0a0604, 8, 17);
const cam = new T.PerspectiveCamera(38, 1, .1, 60);
cam.position.set(0, .7, 7);

/* --- Окружение для бликов на глазури (собирается из простых светящихся панелей) --- */
{
  const env = new T.Scene();
  env.add(new T.Mesh(new T.SphereGeometry(20, 16, 8), new T.MeshBasicMaterial({ color: 0x1a0f0a, side: T.BackSide })));
  const panel = (c, w, h, x, y, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel(0xfff1e0, 8, 3, 0, 9, 4);   // мягкий софтбокс сверху
  panel(0xffd2a8, 3, 8, 9, 2, 2);   // тёплый справа
  panel(0xff5a4a, 2, 6, -9, 1, -2); // красный контровой
  panel(0xffffff, 4, 1, -3, 4, 8);  // узкий блик спереди
  const pm = new T.PMREMGenerator(R);
  S.environment = pm.fromScene(env, .04).texture;
  pm.dispose();
}

S.add(new T.HemisphereLight(0xffe8d6, 0x2a140c, .35));
const key = new T.DirectionalLight(0xffe0bd, 1.4); key.position.set(3, 6, 4); S.add(key);
const rim = new T.PointLight(0xe3423a, 2.4, 12); rim.position.set(-3, 1.5, 1.5); S.add(rim);

/* --- Утилиты --- */
const V2 = (x, y) => new T.Vector2(x, y);
const smooth = (pts, n) => new T.SplineCurve(pts.map(p => V2(p[0], p[1]))).getPoints(n);
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
}

/* --- Материалы --- */
const glazeRed = new T.MeshPhysicalMaterial({ color: 0xb8231d, roughness: .22, clearcoat: 1, clearcoatRoughness: .08, side: T.DoubleSide });
const glazeWhite = new T.MeshPhysicalMaterial({ color: 0xf4eee6, roughness: .28, clearcoat: .8, clearcoatRoughness: .12, side: T.DoubleSide });
const bisque = new T.MeshStandardMaterial({ color: 0xcdb89f, roughness: .9, side: T.DoubleSide }); // неглазурованная ножка
const steel = new T.MeshStandardMaterial({ color: 0xd9d4ce, metalness: 1, roughness: .18 });

/* --- Чашка --- */
const cup = new T.Group(); S.add(cup);
const model = new T.Group(); cup.add(model); // сама чашка с блюдцем, чтобы наклонять её отдельно

// Ножка (кольцо без глазури)
model.add(new T.Mesh(new T.LatheGeometry([V2(0, .005), V2(.36, .005), V2(.4, .0), V2(.43, .02), V2(.43, .045)], 96), bisque));
// Наружная стенка — красная глазурь, плавный изгиб
const outer = smooth([[.43, .045], [.47, .07], [.56, .17], [.66, .36], [.73, .58], [.77, .8], [.785, .95], [.786, .99]], 80);
model.add(new T.Mesh(new T.LatheGeometry(outer, 96), glazeRed));
// Скруглённый край и внутренняя стенка — белая глазурь
const rimArc = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; rimArc.push(V2(.773 + Math.cos(a) * .013, .99 + Math.sin(a) * .013)); }
const inner = smooth([[.76, .99], [.752, .9], [.72, .66], [.64, .4], [.5, .2], [.3, .135], [0, .125]], 80);
model.add(new T.Mesh(new T.LatheGeometry([...rimArc, ...inner], 96), glazeWhite));
// Тонкая белая полоска у края снаружи
const band = new T.Mesh(new T.TorusGeometry(.784, .006, 8, 128), glazeWhite); band.rotation.x = Math.PI / 2; band.position.y = .93; model.add(band);

// Кофе с латте-артом (рисуется на canvas)
const latte = canvasTex(1024, (g, s) => {
  const c = s / 2;
  let gr = g.createRadialGradient(c, c, 0, c, c, c);
  gr.addColorStop(0, '#c58d5c'); gr.addColorStop(.6, '#9a5f34'); gr.addColorStop(.92, '#5d3219'); gr.addColorStop(1, '#3b1e0e');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  // мелкие пузырьки крема
  for (let i = 0; i < 900; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * c * .95; g.fillStyle = `rgba(255,230,200,${Math.random() * .08})`; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, Math.random() * 3 + .5, 0, 6.28); g.fill(); }
  // тюльпан из трёх сердец
  g.fillStyle = '#f6eadb'; g.shadowColor = 'rgba(246,234,219,.6)'; g.shadowBlur = 18;
  const heart = (y, w, h) => { g.beginPath(); g.moveTo(c, y + h); g.bezierCurveTo(c - w * 1.1, y + h * .45, c - w * .9, y - h * .15, c, y + h * .22); g.bezierCurveTo(c + w * .9, y - h * .15, c + w * 1.1, y + h * .45, c, y + h); g.fill(); };
  heart(c - 300, 150, 190); heart(c - 130, 200, 230); heart(c + 60, 250, 260);
  // «стебель» — протяжка питчером
  g.shadowBlur = 6; g.strokeStyle = '#f6eadb'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(c, c - 330); g.lineTo(c, c + 330); g.stroke();
});
const coffee = new T.Mesh(new T.CircleGeometry(.75, 96), new T.MeshPhysicalMaterial({ map: latte, roughness: .35, clearcoat: .6, clearcoatRoughness: .2 }));
coffee.rotation.x = -Math.PI / 2; coffee.rotation.z = Math.PI / 2; coffee.position.y = .87; model.add(coffee);

// Ручка: трубка по кривой, сплюснутая по толщине
const hCurve = new T.CatmullRomCurve3([
  new T.Vector3(.72, .8, 0), new T.Vector3(.95, .86, 0), new T.Vector3(1.13, .74, 0),
  new T.Vector3(1.13, .5, 0), new T.Vector3(.98, .34, 0), new T.Vector3(.64, .3, 0)
]);
const handle = new T.Mesh(new T.TubeGeometry(hCurve, 80, .055, 20, false), glazeRed);
handle.scale.z = .75; model.add(handle);
// упор для пальца сверху ручки
const thumb = new T.Mesh(new T.SphereGeometry(.07, 24, 16), glazeRed); thumb.scale.set(1.2, .5, .9); thumb.position.set(.96, .9, 0); model.add(thumb);

// Блюдце: ножка, углубление под чашку, широкий бортик
const saucerPts = smooth([[0, .02], [.5, .0], [.56, .025], [.7, .04], [1.05, .1], [1.3, .17], [1.36, .2], [1.34, .215], [1.27, .2], [1.0, .13], [.66, .085], [.55, .065], [.47, .07], [0, .07]], 160);
const saucer = new T.Mesh(new T.LatheGeometry(saucerPts, 128), glazeWhite); saucer.position.y = -.065; model.add(saucer);
const sRing = new T.Mesh(new T.TorusGeometry(1.33, .008, 8, 160), glazeRed); sRing.rotation.x = Math.PI / 2; sRing.position.y = .145; model.add(sRing);

// Ложечка на блюдце
const spoon = new T.Group();
const bowl = new T.Mesh(new T.SphereGeometry(.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), steel);
bowl.scale.set(.8, .28, 1.15); bowl.rotation.x = Math.PI; spoon.add(bowl);
const stem = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 0, .12), new T.Vector3(0, .03, .35), new T.Vector3(0, .07, .62)]), 30, .018, 10), steel);
stem.scale.x = 1.8; spoon.add(stem);
spoon.position.set(.55, .1, .78); spoon.rotation.y = .9; model.add(spoon);

// Мягкая тень под блюдцем
const shadowTex = canvasTex(256, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
const shadow = new T.Mesh(new T.PlaneGeometry(3.6, 3.6), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.075; model.add(shadow);

// Пар: мягкие полупрозрачные клубы
const puff = canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
const SN = 70, sg = new T.BufferGeometry(), sp = new Float32Array(SN * 3);
for (let i = 0; i < SN; i++) { sp[i * 3] = (Math.random() - .5) * .5; sp[i * 3 + 1] = .9 + Math.random() * 1.8; sp[i * 3 + 2] = (Math.random() - .5) * .5; }
sg.setAttribute('position', new T.BufferAttribute(sp, 3));
const steam = new T.Points(sg, new T.PointsMaterial({ map: puff, color: 0xffffff, size: .42, transparent: true, opacity: .13, depthWrite: false }));
cup.add(steam);

/* --- Барабан обжарки --- */
const drum = new T.Group(); S.add(drum);
const dcyl = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, 2.6, 28, 6, true), new T.MeshStandardMaterial({ color: 0xb8a99a, metalness: .8, roughness: .35, wireframe: true }));
dcyl.rotation.z = Math.PI / 2; drum.add(dcyl);
[-1.3, 1.3].forEach(x => { const r = new T.Mesh(new T.TorusGeometry(1.15, .05, 12, 48), glazeRed); r.rotation.y = Math.PI / 2; r.position.x = x; drum.add(r); });

/* --- Метка на карте --- */
const pin = new T.Group(); S.add(pin);
const ph = new T.Mesh(new T.SphereGeometry(.38, 32, 24), glazeRed); ph.position.y = 1.05; pin.add(ph);
const pc = new T.Mesh(new T.ConeGeometry(.33, .9, 32), glazeRed); pc.rotation.x = Math.PI; pc.position.y = .5; pin.add(pc);
const dot = new T.Mesh(new T.SphereGeometry(.13, 16, 12), glazeWhite); dot.position.set(0, 1.08, .3); pin.add(dot);
const ring = new T.Mesh(new T.TorusGeometry(.6, .03, 8, 48), new T.MeshBasicMaterial({ color: 0xe6be8e })); ring.rotation.x = Math.PI / 2; pin.add(ring);

/* --- Зёрна (instanced) с бороздкой --- */
const N = 70, bg = new T.SphereGeometry(.13, 20, 14);
{ // вдавливаем бороздку посередине зерна
  const p = bg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (y > 0) p.setY(i, y - .045 * Math.exp(-(x * x) / .0012)); }
  bg.computeVertexNormals(); bg.scale(1, .72, 1.35);
}
const bm = new T.MeshStandardMaterial({ color: 0x7a4a2a, roughness: .4 });
const beans = new T.InstancedMesh(bg, bm, N); S.add(beans);
const B = Array.from({ length: N }, () => ({
  p: new T.Vector3((Math.random() - .5) * 10, (Math.random() - .5) * 6, -1 - Math.random() * 3),
  h: [(Math.random() - .5) * 10, (Math.random() - .5) * 6, -.5 - Math.random() * 4],
  s: Math.random() * 6, r: new T.Euler(Math.random() * 6, Math.random() * 6, 0)
}));
const dummy = new T.Object3D(), tv = new T.Vector3(), light = new T.Color(0xcf9a62), dark = new T.Color(0x1c0e07);

/* --- Размеры и мышь --- */
const st = { cup: 1, drum: 0, pin: 0 };
let mx = 0, my = 0, cx = 2, cy = 0, k = 1;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
function size() {
  const W = innerWidth, H = innerHeight, m = W < 800;
  R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
  cx = m ? 0 : 2.1; cy = m ? 1.35 : 0; k = m ? .62 : 1;
}
addEventListener('resize', size); size();

function beanTarget(b, i, t) {
  const tg = state.target;
  if (tg === 'menu') { const a = i / N * Math.PI * 2 + t * .25, r = 2.2 + (i % 3) * .35; return tv.set(cx + Math.cos(a) * r * k, cy - .1 + Math.sin(a) * r * .32 * k, Math.sin(a) * r * .7); }
  if (tg === 'roast') { const a = i * 2.4 + t * 1.6, rr = (.25 + (i % 5) * .15) * k; return tv.set(cx + ((i % 10) / 9 - .5) * 2.1 * k, cy - .25 * k + Math.cos(a) * rr, Math.sin(a) * rr); }
  if (tg === 'visit') return tv.set(cx + b.h[0] * .5 * k, cy - 1.05 * k + Math.abs(Math.sin(t * 1.3 + b.s)) * .06, b.h[2] * .5 + 1);
  return tv.set(b.h[0], b.h[1] + Math.sin(t * .6 + b.s) * .25, b.h[2]);
}

/* --- Анимация --- */
const clock = new T.Clock(); let t = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), .05); t += state.reduce ? dt * .25 : dt;
  const tg = state.target;
  const g = { cup: tg === 'home' ? 1 : tg === 'menu' ? .5 : 0, drum: tg === 'roast' ? 1 : 0, pin: tg === 'visit' ? 1 : 0 };
  for (const n in st) st[n] += (g[n] - st[n]) * Math.min(1, dt * 4);

  cup.scale.setScalar(Math.max(st.cup * k, .0001));
  cup.position.set(cx, cy - .55 * k + Math.sin(t) * .05, 0);
  model.rotation.y = -.6 + Math.sin(t * .3) * .5 + mx * .7;
  cup.rotation.x = .28 + my * .2;

  const pa = sg.attributes.position.array;
  for (let i = 0; i < SN; i++) {
    pa[i * 3 + 1] += dt * .4; pa[i * 3] += Math.sin(t * 1.5 + i) * dt * .1;
    if (pa[i * 3 + 1] > 2.8) { pa[i * 3 + 1] = .9; pa[i * 3] = (Math.random() - .5) * .45; }
  }
  sg.attributes.position.needsUpdate = true;

  drum.scale.setScalar(Math.max(st.drum * k, .0001)); drum.position.set(cx, cy - .25 * k, 0);
  dcyl.rotation.x = t * 1.2; drum.rotation.y = -.5 + mx * .4;

  pin.scale.setScalar(Math.max(st.pin * k, .0001));
  pin.position.set(cx + (state.loc - 1) * .9 * k, cy - 1.1 * k + Math.abs(Math.sin(t * 2)) * .12 * k, .3);
  pin.rotation.y = t * .8;

  bm.color.copy(light).lerp(dark, tg === 'roast' ? state.roast / 100 : .45);
  B.forEach((b, i) => {
    b.p.lerp(beanTarget(b, i, t), Math.min(1, dt * 2.5));
    b.r.x += dt * (.3 + (i % 4) * .2); b.r.y += dt * .4;
    dummy.position.copy(b.p); dummy.rotation.copy(b.r); dummy.scale.setScalar(tg === 'home' ? 1 : k);
    dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix);
  });
  beans.instanceMatrix.needsUpdate = true;

  cam.position.x += (mx * .6 - cam.position.x) * dt * 2;
  cam.position.y += (.7 - my * .4 - cam.position.y) * dt * 2;
  cam.lookAt(0, 0, 0);
  R.render(S, cam);
  requestAnimationFrame(frame);
}
frame();
} catch (err) { console.warn('3D выключено:', err); } }
