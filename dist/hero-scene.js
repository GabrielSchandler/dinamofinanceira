import * as THREE from 'three';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from './vendor/jsm/geometries/RoundedBoxGeometry.js';
import { createSurfaces, createStoneFloor, studioEnvironment } from './hero-surfaces.js';

const root = document.documentElement;
const hero = document.querySelector('.hero');
const stage = document.querySelector('.hero__stage');
const canvas = document.querySelector('.hero__canvas');
const copy = document.querySelector('.hero__copy');

// layout empilhado (texto em cima, cena embaixo) só em tela estreita e em pé;
// celular deitado usa o layout lado a lado, como o desktop
const MOBILE_QUERY = '(max-width: 767px) and (orientation: portrait)';
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = window.matchMedia(MOBILE_QUERY);
const mqPointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);
const outCubic = (t) => 1 - (1 - t) ** 3;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Sem WebGL nada acontece aqui: o CSS já mostra a imagem estática.
if (hasWebGL()) {
  try {
    start();
  } catch (err) {
    console.error('[hero] cena 3D indisponível, usando a imagem estática', err);
    root.classList.remove('webgl', 'motion', 'hero-pending');
  }
} else {
  root.classList.remove('hero-pending');
}

function start() {
  // ------------------------------------------------------------------ renderer
  // A cena desenha o próprio fundo (parede e piso), então o canvas é opaco: isso permite
  // sombras reais e o brilho (bloom) em volta das arestas e reflexos.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.localClippingEnabled = true; // usado para "desenhar" a seta na entrada
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x171b19);
  // estúdio escuro com faixas de luz quente: é o que dá os reflexos do ouro polido
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.8;

  const DIST = 17;
  const BASE_TURN = -0.38;
  const WALL_Z = -4.2;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // pós-processamento: suavização (MSAA), bloom e conversão de cor
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: mqMobile.matches ? 2 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.055, 0.3, 3.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ----------------------------------------------------------------- materials
  const surfaces = createSurfaces();
  const glowTex = glowTexture();
  const arrowClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e4);
  const barMat = surfaces.graphite;
  const goldMat = surfaces.gold.clone();
  goldMat.clippingPlanes = [arrowClip];
  goldMat.clipShadows = true;
  const goldSide = goldMat.clone();
  goldSide.color.set(0xd9a84f);
  goldSide.roughness = 0.38;
  const ribbonGold = surfaces.gold.clone();
  ribbonGold.color.set(0xdfaa51);
  ribbonGold.roughness = 0.38;
  const ribbonDark = new THREE.MeshPhysicalMaterial({ color: 0x101515, metalness: 0.7, roughness: 0.3, clearcoat: 0.2, clearcoatRoughness: 0.2 });

  // ------------------------------------------------------------------ geometry
  // x, altura, fileira (-1 = fundo, +1 = frente)
  const BARS = [
    [-1.5, 1.9, -1], [-0.35, 3.0, -1], [0.8, 4.0, -1],
    [-2.1, 1.2, 1], [-0.95, 1.35, 1], [0.2, 1.9, 1], [1.35, 2.6, 1], [2.45, 3.8, 1],
  ];
  const BAR_W = 0.9;
  const barGeos = BARS.map(([, h]) => new RoundedBoxGeometry(BAR_W, h, BAR_W, 3, 0.045));
  const barFaces = BARS.map(([, h]) => barFaceGeometry(BAR_W, h));

  const ARROW_Z = 1.15;
  const ARROW_TIP = [2.95, 5.45];
  const arrowGeo = arrowGeometry([[-2.4, 0.95], [-0.55, 2.9], [0.3, 2.3], ARROW_TIP], 0.2, 0.83, 0.47);

  // A faixa são três tiras lado a lado (ouro, grafite, ouro) sobre a mesma curva.
  const RIBBON_Z = 2.1;
  const ribbonCurve = new THREE.CatmullRomCurve3(
    [[-5.4, 0.46, -0.65], [-3.9, 0.84, -0.4], [-2.3, 0.82, 0.05], [-0.6, 0.56, 0.32], [1.4, 0.86, 0.06], [3.2, 1.86, -0.35], [4.9, 3.5, -0.9]].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  const ribbonGeos = [
    ribbonGeometry(ribbonCurve, 0.33, 0.29),
    ribbonGeometry(ribbonCurve, 0.0, 0.37),
    ribbonGeometry(ribbonCurve, -0.33, 0.29),
  ];
  const ribbonCount = ribbonGeos[0].index.count;
  // abertura de cada tira (y, z) no fim da rolagem: sobem e avançam em leque, sem cruzar
  const RIBBON_OPEN = [[0.5, 0.0], [0.28, 0.45], [0.08, 0.9]];

  // --------------------------------------------------------------------- scene
  const rig = new THREE.Group();
  rig.rotation.y = BASE_TURN;
  scene.add(rig);
  // fundo que acompanha o conjunto na horizontal, mas não gira com ele
  const backdrop = new THREE.Group();
  scene.add(backdrop);

  function buildSet() {
    const group = new THREE.Group();
    const lit = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
    const bars = BARS.map(([x, h, row], i) => {
      const mesh = lit(new THREE.Mesh(barGeos[i], surfaces.gold));
      mesh.add(lit(new THREE.Mesh(barFaces[i], barMat)));
      mesh.userData = {
        x, h,
        z: row * 0.5,
        dz: row < 0 ? -1.6 - 0.2 * (i % 2) : 0.45,
        lift: 0.1 + 0.09 * (i % 3),
        delay: i * 0.035,
        phase: i * 1.7,
      };
      group.add(mesh);
      return mesh;
    });
    const arrow = lit(new THREE.Mesh(arrowGeo, [goldMat, goldSide]));
    group.add(arrow);
    const ribbons = ribbonGeos.map((g, j) => {
      const mesh = lit(new THREE.Mesh(g, j === 1 ? ribbonDark : ribbonGold));
      group.add(mesh);
      return mesh;
    });
    return { group, bars, arrow, ribbons };
  }

  const main = buildSet();
  rig.add(main.group);
  const sets = [main];

  // piso polido escuro + plano que só recebe as sombras
  const floor = createStoneFloor(surfaces.stone, mqMobile.matches);
  floor.position.set(0, 0, WALL_Z + 15);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.ShadowMaterial({ opacity: 0.4 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.set(0, 0.004, WALL_Z + 15);
  shadowCatcher.receiveShadow = true;
  scene.add(floor, shadowCatcher);

  // parede grafite texturizada
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(90, 36), surfaces.wall);
  wall.position.set(0, 18, WALL_Z);
  wall.receiveShadow = true;
  scene.add(wall);

  // luzes de fundo: contraluz quente atrás do conjunto, brilho no piso e o foco do canto superior esquerdo
  const glowMat = (opacity, color = 0xd9a04e) => new THREE.MeshBasicMaterial({
    map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(15, 12), glowMat(0.016));
  backGlow.position.set(0.8, 3.0, WALL_Z + 0.06);
  backdrop.add(backGlow);
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(11, 7), glowMat(0.018));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0.4, 0.012, 1.6);
  rig.add(floorGlow);
  const cornerGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat(0.02, 0xb8a58a));
  scene.add(cornerGlow);

  // brilho na ponta da seta (acende quando a luz chega nela)
  const tipStar = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({
    map: starTexture(), color: 0xffe2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  }));
  tipStar.position.set(ARROW_TIP[0] - 0.08, ARROW_TIP[1] - 0.08, 0.45);
  main.arrow.add(tipStar);

  // linhas de luz verticais na parede, como na referência
  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.36).multiplyScalar(0.9), transparent: true, opacity: 0.4 });
  const wallLines = [[-2.7, 3.4], [-1.05, 4.9], [0.5, 12], [1.8, 12], [3.2, 7]].map(([x, h]) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1).translate(0, 0.5, 0), lineMat);
    line.position.set(x, 0, WALL_Z + 0.08);
    line.userData.h = h;
    backdrop.add(line);
    return line;
  });

  // luz principal (com sombra), contraluz quente e preenchimento
  const key = new THREE.DirectionalLight(0xfff7ed, 2.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 8, bottom: -5, near: 1, far: 45 });
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 10;
  const rim = new THREE.DirectionalLight(0xffd19a, 2.1);
  rim.position.set(8, 6, -7);
  // luz de preenchimento pela direita: mantém o dourado quando o conjunto gira na rolagem
  const fill = new THREE.DirectionalLight(0xe9f1ff, 0.8);
  fill.position.set(9, 4, 8);
  scene.add(key, key.target, rim, fill);

  // luz que percorre o metal (o "reflexo discreto" do estado inicial)
  const sweep = new THREE.PointLight(0xffdfa8, 0, 0, 2);
  rig.add(sweep);

  // --------------------------------------------------------------------- state
  const state = { bars: 0, arrow: 0, ribbon: 0, turn: 0, fade: 0 }; // ligado ao scroll
  const intro = { v: 1 }; // montagem ao carregar (0 → 1), independente do scroll
  // quantidade de movimento por eixo: o celular tem pouca largura, então abre mais em profundidade
  const AMP = {
    desktop: { x: 1, y: 1, z: 1, arrow: 1, ribbon: 1, turn: 0.34 },
    mobile: { x: 0.35, y: 0.7, z: 0.85, arrow: 0.6, ribbon: 0.7, turn: 0.3 },
  };
  let amp = AMP.desktop;
  let now = 0;
  let introPlayed = false;
  const maxDelay = BARS.length * 0.035;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const axis = new THREE.Vector3();

  function apply() {
    rig.rotation.y = BASE_TURN - ease(state.turn) * amp.turn + pointer.x * 0.05;
    rig.rotation.x = pointer.y * 0.018;
    rig.updateMatrixWorld();

    // entrada: barras sobem do piso, seta é revelada da base à ponta, faixa se estende
    const iv = intro.v;
    arrowClip.set(axis.set(-1, 0, 0), iv >= 1 ? 1e4 : -2.8 + 6.4 * ease(clamp01((iv - 0.25) / 0.65)));
    if (iv < 1) arrowClip.applyMatrix4(rig.matrixWorld);
    const stride = ribbonGeos[0].userData.segmentIndices;
    const drawn = iv >= 1 ? ribbonCount : Math.floor((ribbonCount * ease(clamp01((iv - 0.1) / 0.8))) / stride) * stride;
    ribbonGeos.forEach((g) => g.setDrawRange(0, drawn));

    for (const set of sets) {
      set.bars.forEach((mesh, i) => {
        const d = mesh.userData;
        const grow = Math.max(0.0001, outCubic(clamp01(iv * 1.7 - i * 0.085)));
        const t = ease(clamp01((state.bars - d.delay) / (1 - maxDelay)));
        const float = Math.sin(now * 0.0011 + d.phase) * 0.04 * t; // peças suspensas: flutuam de leve quando abertas
        mesh.scale.y = grow;
        mesh.position.set(
          d.x + (d.x - 0.15) * 0.26 * t * amp.x,
          (d.h * grow) / 2 + d.lift * t * amp.y + float,
          d.z + d.dz * t * amp.z,
        );
      });
      const ta = state.arrow * amp.arrow;
      set.arrow.position.set(0.12 * ta, 1.0 * ta + Math.sin(now * 0.0009) * 0.05 * state.arrow, ARROW_Z + 0.5 * ta);
      set.arrow.rotation.z = 0.04 * ta;
      const tr = ease(state.ribbon) * amp.ribbon;
      set.ribbons.forEach((mesh, j) => {
        mesh.position.set(0, RIBBON_OPEN[j][0] * tr, RIBBON_Z + RIBBON_OPEN[j][1] * tr);
      });
    }
    canvas.style.opacity = String(1 - state.fade);
  }

  // -------------------------------------------------------------------- layout
  function layout() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const mobile = mqMobile.matches;
    // limita a resolução em telas de alta densidade
    const pr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);

    const lookY = mobile ? 3.75 : 2.85; // no celular a cena desce para a metade de baixo
    camera.aspect = w / h;
    camera.position.set(0, lookY + 0.9, DIST);
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();

    const vh = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vw = vh * camera.aspect;
    // celular: o conjunto ocupa toda a largura (a faixa sangra pelas bordas)
    let s = mobile ? Math.min((vw * 1.04) / 6.4, (vh * 0.46) / 5.8) : Math.min((vw * 0.4) / 6.4, (vh * 0.64) / 5.8);
    if (mobile) {
      // em telas baixas o conjunto encolhe para nunca alcançar o botão, nem com a seta já elevada
      const floorPx = (0.5 + lookY / vh) * h;
      const room = floorPx - (copy.offsetTop + copy.offsetHeight) - 28;
      s = Math.min(s, Math.max(0.3, room / (6.3 * (h / vh))));
    }
    rig.scale.setScalar(s);
    rig.position.x = (mobile ? 0 : vw * 0.25) - (mobile ? 0.3 : 0.4) * s;
    // fundo e luz principal acompanham o conjunto
    backdrop.position.x = rig.position.x;
    backdrop.scale.setScalar(s);
    backdrop.position.z = WALL_Z * (1 - s);
    // no celular as linhas param abaixo do texto
    wallLines.forEach((line) => { line.scale.y = Math.min(line.userData.h, mobile ? 6.3 : 6.8); });
    key.position.set(rig.position.x - 7, 11, 9);
    key.target.position.set(rig.position.x, 1.5 * s, 0);
    key.target.updateMatrixWorld();
    // foco de luz no canto superior esquerdo da parede
    const wallVh = 2 * (DIST - WALL_Z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    cornerGlow.scale.setScalar(wallVh * 1.25);
    cornerGlow.position.set((-wallVh * camera.aspect) / 2, lookY + wallVh / 2, WALL_Z + 0.05);
    requestRender();
  }

  // --------------------------------------------------------------- render loop
  let raf = 0;
  let inView = true;
  let dirty = true;
  let contextLost = false;
  let lastFrame = -Infinity;

  const shouldAnimate = () => inView && !document.hidden && !mqReduce.matches && state.fade < 0.995;

  function requestRender() {
    if (contextLost) return;
    dirty = true;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(time) {
    raf = 0;
    if (contextLost) return;
    const animate = shouldAnimate();
    if (animate && !dirty && time - lastFrame < 1000 / 30) {
      raf = requestAnimationFrame(tick);
      return;
    }
    if (animate) {
      now = time;
      const u = (time / 6500) % 1;
      const env = Math.sin(Math.PI * u) ** 2;
      const sx = -5.5 + 11.5 * u;
      sweep.position.set(sx, 1.2 + 4.2 * u, 5.5);
      sweep.intensity = 8 * env;
      tipStar.material.opacity = intro.v >= 1 ? 0.18 * Math.exp(-(((u - 0.74) / 0.07) ** 2)) : 0;
      backGlow.material.opacity = 0.016 + 0.004 * Math.sin(time * 0.0009);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      dirty = true;
    }
    if (dirty) {
      apply();
      composer.render();
      lastFrame = time;
      root.classList.add('webgl');
      root.classList.remove('hero-pending');
      dirty = false;
    }
    // fora da tela (ou com a cena já apagada) o laço para; qualquer mudança chama requestRender()
    if (animate) raf = requestAnimationFrame(tick);
  }

  function staticLight() {
    sweep.position.set(0.5, 3.4, 5.5);
    sweep.intensity = 6;
    tipStar.material.opacity = 0;
    pointer.x = pointer.y = pointer.tx = pointer.ty = 0;
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) requestRender();
  }).observe(stage);
  document.addEventListener('visibilitychange', requestRender);
  window.addEventListener('resize', layout);
  window.addEventListener('pointermove', (e) => {
    if (!mqPointer.matches) return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    contextLost = true;
    inView = false;
    cancelAnimationFrame(raf);
    raf = 0;
    root.classList.remove('webgl', 'motion', 'hero-pending');
    window.gsap?.killTweensOf(intro);
    window.ScrollTrigger?.getAll().filter((trigger) => trigger.trigger === hero).forEach((trigger) => trigger.kill());
    window.gsap?.set(copy, { clearProps: 'all' });
  });

  // -------------------------------------------------------------------- scroll
  // O progresso da timeline segue o scroll: parar de rolar para a animação, rolar para cima recompõe
  // o gráfico. `scrub: 0.3` só amacia o movimento (ele alcança a posição do scroll em 0,3 s).
  const { gsap, ScrollTrigger } = window;
  staticLight();

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true }); // a barra de endereço do celular não recalcula tudo
    const mm = gsap.matchMedia();
    mm.add(
      { wide: '(min-width: 768px), (orientation: landscape)', mobile: MOBILE_QUERY, reduce: '(prefers-reduced-motion: reduce)' },
      (ctx) => {
        if (contextLost) return undefined;
        const { mobile, reduce } = ctx.conditions;
        Object.assign(state, { bars: 0, arrow: 0, ribbon: 0, turn: 0, fade: 0 });
        amp = mobile ? AMP.mobile : AMP.desktop;
        if (reduce) {
          // composição estática: sem entrada, sem distância extra de rolagem e sem separação das peças
          root.classList.remove('motion');
          gsap.killTweensOf(intro);
          intro.v = 1;
          staticLight();
          layout();
          return undefined;
        }
        root.classList.add('motion');
        layout();

        if (!introPlayed) {
          introPlayed = true;
          intro.v = 0;
          gsap.to(intro, { v: 1, duration: 2.1, delay: 0.15, ease: 'none', onUpdate: requestRender });
        }

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: requestRender,
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (mobile ? 0.52 : 0.6))}`,
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        });
        tl.to(state, { bars: 1, duration: 0.8 }, 0)
          .to(state, { turn: 1, duration: 1 }, 0)
          .to(state, { arrow: 1, duration: 0.72, ease: 'sine.inOut' }, 0.06)
          .to(state, { ribbon: 1, duration: 0.62 }, 0.16)
          .to(copy, { autoAlpha: 0, y: -18, duration: 0.24 }, 0.6)
          .to(state, { fade: 1, duration: 0.34, ease: 'sine.in' }, 0.66);

        return () => {
          root.classList.remove('motion');
          gsap.set(copy, { clearProps: 'all' });
          Object.assign(state, { bars: 0, arrow: 0, ribbon: 0, turn: 0, fade: 0 });
          requestRender();
        };
      },
    );
  } else {
    layout();
  }

  // gancho de depuração: retângulo (px) ocupado por barras + seta, para checar sobreposição com o texto
  const arrowBox = new THREE.Box3().setFromBufferAttribute(arrowGeo.attributes.position);
  window.__dinamoHero = {
    state,
    intro,
    requestRender,
    sceneRect() {
      const box = new THREE.Box3();
      main.bars.forEach((m) => box.expandByObject(m));
      box.union(arrowBox.clone().applyMatrix4(main.arrow.matrixWorld));
      const r = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const p = new THREE.Vector3(x, y, z).project(camera);
        const px = (p.x * 0.5 + 0.5) * stage.clientWidth;
        const py = (-p.y * 0.5 + 0.5) * stage.clientHeight;
        r.left = Math.min(r.left, px); r.right = Math.max(r.right, px);
        r.top = Math.min(r.top, py); r.bottom = Math.max(r.bottom, py);
      }
      return r;
    },
  };
}

// ---------------------------------------------------------------------- helpers


// Gradiente radial suave para os brilhos de fundo.
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.38)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Estrela de quatro pontas para o brilho na ponta da seta.
function starTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const core = ctx.createRadialGradient(128, 128, 0, 128, 128, 60);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 256, 256);
  for (const horizontal of [true, false]) {
    const g = horizontal ? ctx.createLinearGradient(0, 0, 256, 0) : ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    if (horizontal) ctx.fillRect(0, 126, 256, 4);
    else ctx.fillRect(126, 0, 4, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}


// Seta em zigue-zague: contorno com espessura constante + ponta, extrudado.
function arrowGeometry(points, half, headLen, headHalf) {
  const P = points.map(([x, y]) => new THREE.Vector2(x, y));
  const dir = (a, b) => b.clone().sub(a).normalize();
  const normal = (d) => new THREE.Vector2(-d.y, d.x);
  const last = P.length - 1;
  const dEnd = dir(P[last - 1], P[last]);
  const base = P[last].clone().addScaledVector(dEnd, -headLen);
  const spine = [...P.slice(0, last), base];

  const left = [];
  const right = [];
  spine.forEach((p, i) => {
    const nPrev = i > 0 ? normal(dir(spine[i - 1], p)) : null;
    const nNext = i < spine.length - 1 ? normal(dir(p, spine[i + 1])) : null;
    let off;
    if (nPrev && nNext) {
      const m = nPrev.clone().add(nNext).normalize();
      off = m.multiplyScalar(half / m.dot(nPrev));
    } else {
      off = (nPrev || nNext).clone().multiplyScalar(half);
    }
    left.push(p.clone().add(off));
    right.push(p.clone().sub(off));
  });

  const nEnd = normal(dEnd);
  const shape = new THREE.Shape();
  shape.moveTo(left[0].x, left[0].y);
  left.slice(1).forEach((p) => shape.lineTo(p.x, p.y));
  const wingL = base.clone().addScaledVector(nEnd, headHalf);
  const wingR = base.clone().addScaledVector(nEnd, -headHalf);
  shape.lineTo(wingL.x, wingL.y);
  shape.lineTo(P[last].x, P[last].y);
  shape.lineTo(wingR.x, wingR.y);
  right.reverse().forEach((p) => shape.lineTo(p.x, p.y));
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 6, steps: 1 });
}

// Closed, gently twisted cross-sections give the ribbons real thickness and curved reflections.
function ribbonGeometry(curve, offset, width) {
  const segments = 160, sides = 20;
  const positions = [], uvs = [], indices = [];
  const tangent = new THREE.Vector3(), across = new THREE.Vector3(), normal = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const center = curve.getPoint(u);
    curve.getTangent(u, tangent);
    const twist = 0.55 * Math.cos(u * Math.PI * 1.6) - 0.22;
    across.set(-tangent.y * Math.cos(twist), tangent.x * Math.cos(twist), Math.sin(twist)).normalize();
    normal.crossVectors(tangent, across).normalize();
    const taper = Math.max(0.002, ease(clamp01(u / 0.24)));
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const k = (offset + Math.sin(angle) * width * 0.5) * taper;
      const depth = Math.cos(angle) * 0.042 * taper;
      positions.push(
        center.x + across.x * k + normal.x * depth,
        center.y + across.y * k + normal.y * depth,
        center.z + across.z * k + normal.z * depth,
      );
      uvs.push(u * 8, j / sides);
      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const joined = new THREE.Vector3(), other = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const first = i * (sides + 1), last = first + sides;
    joined.fromBufferAttribute(normals, first).add(other.fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, joined.x, joined.y, joined.z);
    normals.setXYZ(last, joined.x, joined.y, joined.z);
  }
  geometry.userData.segmentIndices = sides * 6;
  return geometry;
}

// Four inset stone faces share one draw call; the solid gold shell remains visible around them.
function barFaceGeometry(width, height) {
  const parts = [];
  for (let side = 0; side < 4; side++) {
    const face = new THREE.PlaneGeometry(width - 0.09, height - 0.09);
    face.translate(0, 0, width / 2 + 0.001);
    face.rotateY(side * Math.PI / 2);
    parts.push(face.toNonIndexed());
    face.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const count = parts.reduce((sum, part) => sum + part.attributes[name].array.length, 0);
    const values = new Float32Array(count);
    let offset = 0;
    for (const part of parts) {
      values.set(part.attributes[name].array, offset);
      offset += part.attributes[name].array.length;
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(values, name === 'uv' ? 2 : 3));
  }
  parts.forEach((part) => part.dispose());
  return geometry;
}
