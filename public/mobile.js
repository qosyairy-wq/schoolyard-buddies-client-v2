(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const config = window.SYB_CONFIG || {};
  const BUILD = 'rebuild-1.0.3';
  const STORAGE_KEY = 'syb_mobile_profile_v1';
  const ENDPOINT_KEY = 'syb_multiplayer_endpoint_v1';
  const ROOM_KEY = 'syb_multiplayer_room_v1';
  const shirtColors = [0x78b1de, 0xe88baa, 0x8fc9b0, 0xb7a6d9, 0xf0b190, 0xe8d27d];
  const skinColors = [0xffd8bd, 0xf4c49e, 0xe2a276, 0xc98252, 0xb66c3c, 0x9a572f, 0x754029, 0x4f2c22];
  const headwearColors = [0xf7f7f7, 0xf0b0c5, 0xa7cbea, 0xb9a8dc, 0xa8d4c2, 0xf2b99d, 0x20252d, 0x172b47];
  const pantsColors = [0x20252d, 0x172b47, 0x435a73, 0x74859a, 0x82778f, 0x85837b];
  const shoeColors = [0x20252d, 0x172b47, 0xee9db5, 0x9ec6e7, 0x96cdbf, 0xb7a8d9, 0xeab093, 0xc7d0d7];
  const bagColors = [0x9ec6e7, 0xeeafc1, 0xa8d4c2, 0xb7a8d9, 0xefb99e, 0xe5cf78];

  const state = {
    profile: { name: '', dob: '', gender: 'female', skin: skinColors[1], headwear: headwearColors[0], shirt: shirtColors[0], pants: pantsColors[1], shoes: shoeColors[4], bag: bagColors[1], year: 1, age: 7 },
    stats: { boxes: 0, stars: 0, coins: 0 },
    mode: 'boot',
    zone: 'plaza',
    paused: false,
    starting: false,
    online: false,
    connecting: false,
    socket: null,
    ownId: '',
    remotePlayers: new Map(),
    chat: [],
    nearest: null,
    quizIndex: 0,
    quizScore: 0,
    settings: { shadows: false, traffic: false, fps: 30 }
  };

  let scene;
  let camera;
  let renderer;
  let player;
  let playerParts = {};
  let worlds = {};
  let activeWorld = null;
  let traffic = [];
  let portalItems = [];
  let yaw = 0;
  let pitch = 0.34;
  let jumpVelocity = 0;
  let grounded = true;
  let lastFrame = 0;
  let lastNetSend = 0;
  let loopStarted = false;
  let controlsBound = false;
  let connectionTimer = 0;

  const input = {
    moveX: 0,
    moveY: 0,
    sprint: false,
    joyPointer: null,
    lookPointer: null,
    lookX: 0,
    lookY: 0
  };

  const quizQuestions = [
    { q: 'Which action is safest before crossing a road?', o: ['Run immediately', 'Look left and right', 'Use a phone while walking', 'Follow a moving car'], a: 1 },
    { q: 'What is 7 + 8?', o: ['13', '14', '15', '16'], a: 2 },
    { q: 'Pilih perkataan yang sama maksud dengan “gembira”.', o: ['Sedih', 'Marah', 'Riang', 'Penat'], a: 2 }
  ];

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function setBootStatus(text, retry = false) {
    $('boot-status').textContent = text;
    $('boot-retry').hidden = !retry;
  }

  function setScreen(id) {
    ['boot', 'setup', 'game'].forEach((name) => {
      $(name).hidden = name !== id;
    });
    state.mode = id;
  }

  function isOverlayOpen() {
    return ['menu', 'character-panel', 'online-panel', 'chat-panel', 'quiz-panel', 'map-panel', 'settings-panel']
      .some((id) => !$(id).hidden);
  }

  function resetInput() {
    input.moveX = 0;
    input.moveY = 0;
    input.sprint = false;
    input.joyPointer = null;
    input.lookPointer = null;
    const knob = $('joystick-knob');
    if (knob) knob.style.transform = '';
  }

  function openPanel(id) {
    resetInput();
    state.paused = true;
    $(id).hidden = false;
    $('game').setAttribute('aria-hidden', 'true');
  }

  function closePanel(id) {
    $(id).hidden = true;
    if (!isOverlayOpen()) {
      state.paused = false;
      $('game').removeAttribute('aria-hidden');
    }
  }

  function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
  }

  function loadProfile() {
    try {
      Object.assign(state.profile, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (_) {}
  }

  function calculateYear() {
    const value = $('player-dob').value;
    if (!value) {
      $('player-year').textContent = 'Enter date of birth';
      $('player-age').textContent = 'The learning year will be selected automatically.';
      return false;
    }

    const birth = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return false;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDifference = now.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birth.getDate())) age -= 1;

    state.profile.dob = value;
    state.profile.age = Math.max(5, age);
    state.profile.year = Math.max(1, Math.min(6, age - 5));
    $('player-year').textContent = `Year ${state.profile.year}`;
    $('player-age').textContent = `Age ${state.profile.age} · automatically selected`;
    return true;
  }

  function colorHex(value, fallback = 0xffffff) {
    const number = Number.isFinite(Number(value)) ? Number(value) : fallback;
    return `#${(number >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
  }

  function normalizeProfile() {
    const defaults = {
      name: '', dob: '', gender: 'female', skin: skinColors[1], headwear: headwearColors[0],
      shirt: shirtColors[0], pants: pantsColors[1], shoes: shoeColors[4], bag: bagColors[1], year: 1, age: 7
    };
    Object.assign(state.profile, defaults, state.profile || {});
    for (const key of ['skin', 'headwear', 'shirt', 'pants', 'shoes', 'bag']) {
      state.profile[key] = Number(state.profile[key] ?? defaults[key]);
    }
    state.profile.gender = state.profile.gender === 'male' ? 'male' : 'female';
  }

  function characterSvg(profile = state.profile) {
    const skin = colorHex(profile.skin, skinColors[1]);
    const headwear = colorHex(profile.headwear, profile.gender === 'male' ? headwearColors[6] : headwearColors[0]);
    const shirt = colorHex(profile.shirt, shirtColors[0]);
    const pants = colorHex(profile.pants, pantsColors[1]);
    const shoes = colorHex(profile.shoes, shoeColors[4]);
    const bag = colorHex(profile.bag, bagColors[1]);
    const female = profile.gender !== 'male';
    const headLayer = female
      ? `<path d="M105 58h270v34h36v250h-46v56h-54v-61H169v61h-54v-56H69V92h36z" fill="${headwear}" stroke="#153456" stroke-width="9" stroke-linejoin="round"/>`
      : `<path d="M106 62h268v42h35v83h-34v-40H105v40H71v-83h35z" fill="${headwear}" stroke="#153456" stroke-width="9" stroke-linejoin="round"/><path d="M114 72h252v38H114z" fill="${headwear}"/>`;
    const chin = female ? `<rect x="151" y="313" width="178" height="47" rx="8" fill="${headwear}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#68b9ef"/><stop offset="1" stop-color="#235596"/></linearGradient></defs>
      <rect width="480" height="560" rx="34" fill="url(#bg)"/><ellipse cx="240" cy="520" rx="128" ry="24" fill="#12355e" opacity=".42"/>
      <rect x="315" y="330" width="73" height="126" rx="12" fill="${bag}" stroke="#153456" stroke-width="9"/>
      <rect x="145" y="404" width="78" height="99" rx="9" fill="${pants}" stroke="#153456" stroke-width="9"/><rect x="257" y="404" width="78" height="99" rx="9" fill="${pants}" stroke="#153456" stroke-width="9"/>
      <rect x="132" y="486" width="101" height="42" rx="10" fill="${shoes}" stroke="#153456" stroke-width="9"/><rect x="247" y="486" width="101" height="42" rx="10" fill="${shoes}" stroke="#153456" stroke-width="9"/>
      <rect x="104" y="324" width="272" height="116" rx="12" fill="${shirt}" stroke="#153456" stroke-width="9"/>
      <rect x="70" y="335" width="52" height="105" rx="12" fill="${shirt}" stroke="#153456" stroke-width="9"/><rect x="358" y="335" width="52" height="105" rx="12" fill="${shirt}" stroke="#153456" stroke-width="9"/>
      <rect x="78" y="417" width="44" height="40" rx="8" fill="${skin}" stroke="#153456" stroke-width="8"/><rect x="358" y="417" width="44" height="40" rx="8" fill="${skin}" stroke="#153456" stroke-width="8"/>
      ${headLayer}<rect x="124" y="122" width="232" height="220" rx="7" fill="${skin}" stroke="#153456" stroke-width="9"/>${chin}
      <rect x="168" y="190" width="34" height="88" rx="5" fill="#452d24"/><rect x="278" y="190" width="34" height="88" rx="5" fill="#452d24"/>
      <rect x="140" y="274" width="48" height="22" rx="4" fill="#f393a9"/><rect x="292" y="274" width="48" height="22" rx="4" fill="#f393a9"/>
      <path d="M205 306h70" stroke="#7e4935" stroke-width="8" stroke-linecap="round"/>
      <path d="M154 368h172" stroke="#e9f7ff" stroke-width="9"/><path d="M240 335v93" stroke="#e9f7ff" stroke-width="9"/>
    </svg>`;
  }

  function render2DPreview() {
    const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(characterSvg())}`;
    ['setup-avatar-image', 'menu-avatar-image', 'character-preview-image'].forEach((id) => {
      const image = $(id);
      if (image) image.src = source;
    });
    if ($('character-preview-name')) $('character-preview-name').textContent = state.profile.name || (state.profile.gender === 'female' ? 'Alisha' : 'Adam');
    if ($('headwear-legend')) $('headwear-legend').textContent = state.profile.gender === 'female' ? 'Hijab colour' : 'Hair colour';
  }

  function makeSwatch(containerId, palette, profileKey) {
    const container = $(containerId);
    if (!container) return;
    container.replaceChildren();
    palette.forEach((color) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `swatch${Number(state.profile[profileKey]) === color ? ' selected' : ''}`;
      button.style.background = colorHex(color);
      button.setAttribute('aria-label', `${profileKey} ${colorHex(color)}`);
      button.addEventListener('click', () => {
        state.profile[profileKey] = color;
        [...container.children].forEach((item) => item.classList.toggle('selected', item === button));
        render2DPreview();
        applyLocalAppearance();
        saveProfile();
      });
      container.appendChild(button);
    });
  }

  function buildCharacterEditor() {
    makeSwatch('edit-skin', skinColors, 'skin');
    makeSwatch('edit-headwear', headwearColors, 'headwear');
    makeSwatch('edit-shirt', shirtColors, 'shirt');
    makeSwatch('edit-pants', pantsColors, 'pants');
    makeSwatch('edit-shoes', shoeColors, 'shoes');
    makeSwatch('edit-bag', bagColors, 'bag');
    render2DPreview();
  }

  function setupProfileUI() {
    loadProfile();
    normalizeProfile();
    $('player-name').value = state.profile.name || '';
    $('player-dob').value = state.profile.dob || '';

    document.querySelectorAll('[data-gender]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.gender === state.profile.gender);
      button.addEventListener('click', () => {
        state.profile.gender = button.dataset.gender;
        state.profile.headwear = state.profile.gender === 'female' ? headwearColors[0] : headwearColors[6];
        document.querySelectorAll('[data-gender]').forEach((item) => item.classList.toggle('selected', item === button));
        render2DPreview();
      });
    });

    render2DPreview();
    $('player-dob').addEventListener('input', calculateYear);
    $('player-dob').addEventListener('change', calculateYear);
    if (state.profile.dob) calculateYear();

    $('enter-plaza').addEventListener('click', async () => {
      if (state.starting) return;
      state.profile.name = $('player-name').value.trim() || (state.profile.gender === 'female' ? 'Alisha' : 'Adam');
      calculateYear();
      saveProfile();
      render2DPreview();
      await startGame();
    });
  }

  function material(color) {
    return new THREE.MeshLambertMaterial({ color });
  }

  function box(group, size, position, color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeCharacter(profile, remote = false) {
    const group = new THREE.Group();
    const skin = Number(profile.skin || skinColors[1]);
    const body = box(group, [0.9, 1.1, 0.55], [0, 1.35, 0], Number(profile.shirt || shirtColors[0]));
    const head = box(group, [1.1, 1.05, 1.0], [0, 2.35, 0], skin);
    const headwearColor = Number(profile.headwear || (profile.gender === 'male' ? headwearColors[6] : headwearColors[0]));
    let hair;
    if (profile.gender === 'male') {
      hair = box(group, [1.16, 0.32, 1.06], [0, 2.88, 0], headwearColor);
    } else {
      hair = new THREE.Group();
      box(hair, [1.16, 0.24, 1.06], [0, 2.88, 0], headwearColor);
      box(hair, [0.18, 1.04, 1.06], [-0.64, 2.35, 0], headwearColor);
      box(hair, [0.18, 1.04, 1.06], [0.64, 2.35, 0], headwearColor);
      box(hair, [0.92, 0.18, 1.06], [0, 1.82, 0], headwearColor);
      group.add(hair);
    }
    const legL = box(group, [0.32, 0.72, 0.36], [-0.22, 0.48, 0], Number(profile.pants || pantsColors[1]));
    const legR = box(group, [0.32, 0.72, 0.36], [0.22, 0.48, 0], Number(profile.pants || pantsColors[1]));
    const armL = box(group, [0.25, 0.9, 0.28], [-0.64, 1.42, 0], skin);
    const armR = box(group, [0.25, 0.9, 0.28], [0.64, 1.42, 0], skin);
    const shoeL = box(group, [0.38, 0.18, 0.55], [-0.22, 0.05, 0.03], Number(profile.shoes || shoeColors[4]));
    const shoeR = box(group, [0.38, 0.18, 0.55], [0.22, 0.05, 0.03], Number(profile.shoes || shoeColors[4]));
    const backpack = box(group, [0.65, 0.78, 0.22], [0, 1.45, 0.4], Number(profile.bag || bagColors[1]));
    group.userData.parts = { body, head, hair, legL, legR, armL, armR, shoeL, shoeR, backpack };

    if (remote) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      context.fillStyle = 'rgba(4,35,72,.92)';
      context.fillRect(0, 0, 256, 64);
      context.fillStyle = '#fff';
      context.font = 'bold 26px sans-serif';
      context.textAlign = 'center';
      context.fillText(profile.name || 'Student', 128, 40);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
      sprite.position.y = 3.5;
      sprite.scale.set(3.2, 0.8, 1);
      group.add(sprite);
    }

    return group;
  }

  function setPartColor(part, value) {
    if (!part) return;
    if (Array.isArray(part)) {
      part.forEach((item) => setPartColor(item, value));
      return;
    }
    if (part.material?.color) part.material.color.setHex(Number(value));
    if (part.traverse) part.traverse((child) => {
      if (child !== part && child.material?.color) child.material.color.setHex(Number(value));
    });
  }

  function applyAppearanceToGroup(group, profile) {
    const parts = group?.userData?.parts;
    if (!parts) return;
    setPartColor(parts.body, profile.shirt || shirtColors[0]);
    setPartColor(parts.head, profile.skin || skinColors[1]);
    setPartColor(parts.armL, profile.skin || skinColors[1]);
    setPartColor(parts.armR, profile.skin || skinColors[1]);
    setPartColor(parts.hair, profile.headwear || (profile.gender === 'male' ? headwearColors[6] : headwearColors[0]));
    setPartColor(parts.legL, profile.pants || pantsColors[1]);
    setPartColor(parts.legR, profile.pants || pantsColors[1]);
    setPartColor(parts.shoeL, profile.shoes || shoeColors[4]);
    setPartColor(parts.shoeR, profile.shoes || shoeColors[4]);
    setPartColor(parts.backpack, profile.bag || profile.backpack || bagColors[1]);
  }

  function appearancePayload() {
    return {
      gender: state.profile.gender,
      skin: state.profile.skin,
      headwear: state.profile.headwear,
      shirt: state.profile.shirt,
      pants: state.profile.pants,
      shoes: state.profile.shoes,
      backpack: state.profile.bag
    };
  }

  function applyLocalAppearance() {
    if (!player) return;
    applyAppearanceToGroup(player, state.profile);
    playerParts = player.userData.parts || playerParts;
    if (state.online) send('appearance_update', { appearance: appearancePayload() });
  }

  function floor(group, width, depth, color = 0xbbe69a) {
    const mesh = box(group, [width, 0.2, depth], [0, -0.1, 0], color);
    mesh.receiveShadow = true;
    return mesh;
  }

  function buildPlaza() {
    const group = new THREE.Group();
    group.name = 'plaza';
    floor(group, 60, 60);
    box(group, [18, 0.25, 18], [0, 0.05, 0], 0xb4bbc5);
    box(group, [4, 1, 4], [0, 0.5, 0], 0xeef7ff);
    box(group, [2, 2, 2], [0, 1.5, 0], 0x75d6ef);

    for (let index = 0; index < 8; index += 1) {
      const angle = index / 8 * Math.PI * 2;
      const bench = box(group, [2.6, 0.45, 0.8], [Math.cos(angle) * 7, 0.25, Math.sin(angle) * 7], 0xa86c36);
      bench.rotation.y = -angle;
    }

    const portal = box(group, [5, 5, 0.7], [0, 2.5, -22], 0x8d61d4);
    portal.userData.interaction = { type: 'zone', zone: 'city', label: 'Enter Schoolyard City' };
    portalItems.push(portal);

    const guide = makeCharacter({ gender: 'male', shirt: 0x3da26c, name: 'Guide' });
    guide.position.set(-7, 0, -2);
    guide.userData.interaction = { type: 'quiz', label: 'Talk to Guide' };
    group.add(guide);
    return group;
  }

  function makeCar(group, x, z, direction, vertical = false) {
    const car = new THREE.Group();
    box(car, [3.2, 0.8, 1.5], [0, 0.65, 0], 0xd94c5e);
    box(car, [1.7, 0.65, 1.3], [0, 1.35, 0], 0x87c9e8);
    car.position.set(x, 0, z);
    car.userData.traffic = { dir: direction, vertical, speed: 4 + Math.random() * 2 };
    group.add(car);
    return car;
  }

  function buildCity() {
    const group = new THREE.Group();
    group.name = 'city';
    floor(group, 90, 90, 0x8edc75);
    box(group, [90, 0.12, 14], [0, 0.05, 0], 0x313943);
    box(group, [14, 0.12, 90], [0, 0.05, 0], 0x313943);

    for (const x of [-30, -15, 15, 30]) {
      for (const z of [-30, -15, 15, 30]) {
        const height = 5 + (Math.abs(x + z) % 5);
        box(group, [10, height, 10], [x, height / 2, z], (x + z) % 30 === 0 ? 0xe29b3e : 0x6fa34d);
      }
    }

    box(group, [18, 8, 14], [-28, 4, -28], 0x6c9c40);
    box(group, [12, 1, 0.5], [-28, 7.2, -20.8], 0x1b70c8);
    const door = box(group, [2.5, 4, 0.5], [-28, 2, -20.7], 0x1f3448);
    door.userData.interaction = { type: 'zone', zone: 'school', label: 'Enter Primary School' };
    portalItems.push(door);

    const returnPortal = box(group, [5, 5, 0.7], [0, 2.5, 38], 0x67d9ff);
    returnPortal.userData.interaction = { type: 'zone', zone: 'plaza', label: 'Return to Waiting Plaza' };
    portalItems.push(returnPortal);

    traffic.push(makeCar(group, -35, -2, 1), makeCar(group, 35, 2, -1), makeCar(group, -3, -35, 1, true));
    return group;
  }

  function buildSchool() {
    const group = new THREE.Group();
    group.name = 'school';
    floor(group, 70, 52, 0xeaf2f6);
    box(group, [70, 4, 0.4], [0, 2, -26], 0xe0d8c7);
    box(group, [70, 4, 0.4], [0, 2, 26], 0xe0d8c7);
    box(group, [0.4, 4, 52], [-35, 2, 0], 0xe0d8c7);
    box(group, [0.4, 4, 52], [35, 2, 0], 0xe0d8c7);

    for (const x of [-17, 0, 17]) {
      box(group, [0.25, 4, 20], [x, 2, -16], 0xe0d8c7);
      box(group, [0.25, 4, 20], [x, 2, 16], 0xe0d8c7);
    }

    for (let index = 0; index < 4; index += 1) {
      const teacher = makeCharacter({
        gender: index % 2 ? 'male' : 'female',
        shirt: [0x64a9dc, 0xe38bab, 0x7bc19d, 0xb19bd6][index],
        name: 'Teacher'
      });
      teacher.position.set(-25 + index * 16.5, 0, index % 2 ? -17 : 17);
      teacher.rotation.y = index % 2 ? 0 : Math.PI;
      teacher.userData.interaction = { type: 'quiz', label: 'Start class assignment' };
      group.add(teacher);
    }

    const exit = box(group, [5, 4, 0.5], [0, 2, 25.7], 0x67d9ff);
    exit.userData.interaction = { type: 'zone', zone: 'city', label: 'Exit to Schoolyard City' };
    portalItems.push(exit);
    return group;
  }

  function ensureWorld(zone) {
    if (worlds[zone]) return worlds[zone];
    const builders = { plaza: buildPlaza, city: buildCity, school: buildSchool };
    const builder = builders[zone];
    if (!builder) throw new Error(`Unknown world: ${zone}`);
    worlds[zone] = builder();
    scene.add(worlds[zone]);
    return worlds[zone];
  }

  function switchZone(zone, initial = false) {
    ensureWorld(zone);
    state.zone = zone;
    Object.entries(worlds).forEach(([name, world]) => {
      world.visible = name === zone;
    });
    activeWorld = worlds[zone];
    if (player && !initial) {
      player.position.set(0, 0, zone === 'school' ? 20 : zone === 'city' ? 32 : 8);
    }
    state.remotePlayers.forEach((remote) => {
      remote.group.visible = remote.zone === state.zone;
    });
    updateZoneLabel();
  }

  function updateZoneLabel() {
    const labels = { plaza: 'Waiting Plaza', city: 'Schoolyard City', school: 'School Interior' };
    $('zone-label').textContent = `${labels[state.zone] || state.zone} · ${state.online ? 'Online' : 'Offline'}`;
  }

  let threeLoadPromise = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoadPromise) return threeLoadPromise;
    threeLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => reject(new Error('The 3D engine took too long to load. Check your connection and retry.')), 20000);
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        clearTimeout(timeout);
        if (window.THREE) resolve(window.THREE);
        else reject(new Error('The 3D engine loaded but did not initialise.'));
      };
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Could not download the 3D engine.'));
      };
      document.head.appendChild(script);
    });
    return threeLoadPromise;
  }

  async function createWorldAsync() {
    setBootStatus('Preparing the Waiting Plaza…');
    await nextFrame();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8cc8ef);
    camera = new THREE.PerspectiveCamera(55, Math.max(1, innerWidth) / Math.max(1, innerHeight), 0.1, 400);

    const canvas = $('world');
    const contextOptions = { alpha: false, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'default' };
    const context = canvas.getContext('webgl2', contextOptions) || canvas.getContext('webgl', contextOptions);
    if (!context) throw new Error('WebGL is unavailable on this device or browser.');
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, innerWidth), Math.max(1, innerHeight), false);
    renderer.shadowMap.enabled = state.settings.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x516b45, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(20, 35, 18);
    sun.castShadow = state.settings.shadows;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    setBootStatus('Building the local Waiting Plaza…');
    await nextFrame();
    ensureWorld('plaza');

    setBootStatus('Creating your player…');
    await nextFrame();
    player = makeCharacter(state.profile);
    scene.add(player);
    playerParts = player.userData.parts;
    player.position.set(0, 0, 8);
    switchZone('plaza', true);

    if (!controlsBound) bindControls();
    resize();
    if (!loopStarted) {
      loopStarted = true;
      requestAnimationFrame(loop);
    }
  }

  async function startGame() {
    if (state.starting) return;
    state.starting = true;
    const enterButton = $('enter-plaza');
    enterButton.disabled = true;
    enterButton.textContent = 'Preparing Waiting Plaza…';
    setScreen('boot');
    setBootStatus('Starting local/offline mode…');

    try {
      await wait(40);
      setBootStatus('Loading the 3D engine…');
      await loadThree();
      await nextFrame();
      if (!scene) await createWorldAsync();
      else switchZone('plaza');
      updateMenu();
      setScreen('game');
      state.paused = false;
      updatePlayer(0.016, performance.now());
      renderer.render(scene, camera);
      await nextFrame();
    } catch (error) {
      console.error('[Schoolyard Mobile] Startup failed:', error);
      setBootStatus(`Could not start the Waiting Plaza: ${error?.message || 'Unknown WebGL error'}`, true);
      $('boot-retry').onclick = () => location.reload();
    } finally {
      state.starting = false;
      enterButton.disabled = false;
      enterButton.textContent = 'Enter Waiting Plaza';
    }
  }

  function resize() {
    if (!renderer || !camera) return;
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(viewport?.width || innerWidth));
    const height = Math.max(1, Math.round(viewport?.height || innerHeight));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function bindControls() {
    controlsBound = true;
    const joystick = $('joystick');
    const knob = $('joystick-knob');

    const updateJoystick = (event) => {
      if (state.paused) return;
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = event.clientX - centerX;
      let dy = event.clientY - centerY;
      const max = rect.width * 0.32;
      const length = Math.hypot(dx, dy) || 1;
      if (length > max) {
        dx = dx / length * max;
        dy = dy / length * max;
      }
      input.moveX = dx / max;
      input.moveY = -dy / max;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    joystick.addEventListener('pointerdown', (event) => {
      if (state.paused) return;
      event.preventDefault();
      input.joyPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      updateJoystick(event);
    });
    joystick.addEventListener('pointermove', (event) => {
      if (input.joyPointer === event.pointerId) updateJoystick(event);
    });
    const endJoystick = (event) => {
      if (input.joyPointer !== event.pointerId) return;
      input.joyPointer = null;
      input.moveX = 0;
      input.moveY = 0;
      knob.style.transform = '';
    };
    joystick.addEventListener('pointerup', endJoystick);
    joystick.addEventListener('pointercancel', endJoystick);

    const lookZone = $('look-zone');
    lookZone.addEventListener('pointerdown', (event) => {
      if (state.paused) return;
      input.lookPointer = event.pointerId;
      input.lookX = event.clientX;
      input.lookY = event.clientY;
      lookZone.setPointerCapture(event.pointerId);
    });
    lookZone.addEventListener('pointermove', (event) => {
      if (state.paused || input.lookPointer !== event.pointerId) return;
      const dx = event.clientX - input.lookX;
      const dy = event.clientY - input.lookY;
      input.lookX = event.clientX;
      input.lookY = event.clientY;
      yaw -= dx * 0.006;
      pitch = Math.max(0.12, Math.min(0.75, pitch + dy * 0.004));
    });
    const endLook = (event) => {
      if (input.lookPointer === event.pointerId) input.lookPointer = null;
    };
    lookZone.addEventListener('pointerup', endLook);
    lookZone.addEventListener('pointercancel', endLook);

    $('sprint-button').addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (!state.paused) input.sprint = true;
    });
    const stopSprint = () => { input.sprint = false; };
    $('sprint-button').addEventListener('pointerup', stopSprint);
    $('sprint-button').addEventListener('pointercancel', stopSprint);
    $('jump-button').addEventListener('click', () => {
      if (!state.paused && grounded) {
        jumpVelocity = 7.5;
        grounded = false;
      }
    });
    $('interact-button').addEventListener('click', interact);
    $('menu-button').addEventListener('click', () => {
      updateMenu();
      openPanel('menu');
    });

    document.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => closePanel(button.dataset.close));
    });
    $('resume-button').addEventListener('click', () => closePanel('menu'));
    $('online-button').addEventListener('click', () => openPanel('online-panel'));
    $('chat-button').addEventListener('click', () => {
      renderChat();
      openPanel('chat-panel');
      setTimeout(() => $('chat-input').focus(), 120);
    });
    $('quiz-button').addEventListener('click', startQuiz);
    $('map-button').addEventListener('click', () => openPanel('map-panel'));
    $('settings-button').addEventListener('click', () => openPanel('settings-panel'));
    $('profile-button').addEventListener('click', () => {
      buildCharacterEditor();
      openPanel('character-panel');
    });
    $('character-save-button').addEventListener('click', () => {
      saveProfile();
      applyLocalAppearance();
      updateMenu();
      closePanel('character-panel');
    });

    document.querySelectorAll('[data-zone]').forEach((button) => {
      button.addEventListener('click', async () => {
        const destination = button.dataset.zone;
        closePanel('map-panel');
        closePanel('menu');
        if (!worlds[destination]) {
          setScreen('boot');
          setBootStatus(`Loading ${destination === 'city' ? 'Schoolyard City' : 'School Interior'}…`);
          await nextFrame();
          ensureWorld(destination);
          await nextFrame();
          setScreen('game');
        }
        switchZone(destination);
      });
    });

    $('shadow-toggle').addEventListener('change', (event) => {
      state.settings.shadows = event.target.checked;
      if (renderer) renderer.shadowMap.enabled = state.settings.shadows;
    });
    $('traffic-toggle').addEventListener('change', (event) => { state.settings.traffic = event.target.checked; });
    $('fps-select').addEventListener('change', (event) => { state.settings.fps = Number(event.target.value); });
    $('connect-button').addEventListener('click', connect);
    $('disconnect-button').addEventListener('click', () => disconnect(true));
    $('chat-form').addEventListener('submit', (event) => {
      event.preventDefault();
      sendChat();
    });
    $('quiz-next').addEventListener('click', nextQuiz);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    const fps = state.settings.fps || 30;
    if (now - lastFrame < 1000 / fps) return;
    const delta = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    if (state.paused || state.mode !== 'game' || !renderer || !player || !activeWorld) return;
    updatePlayer(delta, now);
    updateTraffic(delta);
    updateNearest();
    updateRemoteInterpolation(delta);
    renderer.render(scene, camera);
  }

  function updatePlayer(delta, now) {
    const speed = input.sprint ? 7.5 : 4.5;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const movement = forward.multiplyScalar(input.moveY).add(right.multiplyScalar(input.moveX));

    if (movement.lengthSq() > 0.01) {
      movement.normalize();
      player.position.addScaledVector(movement, speed * delta);
      player.rotation.y = Math.atan2(movement.x, movement.z);
      const phase = now * 0.012 * (input.sprint ? 1.5 : 1);
      playerParts.armL.rotation.x = Math.sin(phase) * 0.8;
      playerParts.armR.rotation.x = -Math.sin(phase) * 0.8;
      playerParts.legL.rotation.x = -Math.sin(phase) * 0.65;
      playerParts.legR.rotation.x = Math.sin(phase) * 0.65;
    } else {
      playerParts.armL.rotation.x = 0;
      playerParts.armR.rotation.x = 0;
      playerParts.legL.rotation.x = 0;
      playerParts.legR.rotation.x = 0;
    }

    jumpVelocity -= 18 * delta;
    player.position.y += jumpVelocity * delta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      jumpVelocity = 0;
      grounded = true;
    }

    const target = player.position.clone().add(new THREE.Vector3(0, 2, 0));
    const distance = 8;
    camera.position.set(
      target.x - Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      target.z - Math.cos(yaw) * Math.cos(pitch) * distance
    );
    camera.lookAt(target);

    if (state.online && now - lastNetSend > 220) {
      lastNetSend = now;
      send('player_state', {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        rotationY: player.rotation.y,
        action: movement.lengthSq() > 0.01 ? (input.sprint ? 'run' : 'walk') : 'idle',
        zone: state.zone
      });
    }
  }

  function updateTraffic(delta) {
    if (!state.settings.traffic || state.zone !== 'city') return;
    traffic.forEach((car) => {
      const trafficState = car.userData.traffic;
      if (trafficState.vertical) {
        car.position.z += trafficState.dir * trafficState.speed * delta;
        if (Math.abs(car.position.z) > 42) car.position.z = -Math.sign(car.position.z) * 42;
      } else {
        car.position.x += trafficState.dir * trafficState.speed * delta;
        if (Math.abs(car.position.x) > 42) car.position.x = -Math.sign(car.position.x) * 42;
      }
    });
  }

  function updateNearest() {
    let nearest = null;
    let bestDistance = 4.2;
    activeWorld.traverse((object) => {
      const interaction = object.userData?.interaction;
      if (!interaction) return;
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      const distance = worldPosition.distanceTo(player.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = { object, interaction };
      }
    });
    state.nearest = nearest;
    $('interaction-prompt').hidden = !nearest;
    $('interact-button').hidden = !nearest;
    if (nearest) $('interaction-text').textContent = nearest.interaction.label;
  }

  function interact() {
    const nearest = state.nearest;
    if (!nearest || state.paused) return;
    if (nearest.interaction.type === 'zone') switchZone(nearest.interaction.zone);
    if (nearest.interaction.type === 'quiz') startQuiz();
  }

  function startQuiz() {
    state.quizIndex = 0;
    state.quizScore = 0;
    renderQuiz();
    openPanel('quiz-panel');
  }

  function renderQuiz() {
    const question = quizQuestions[state.quizIndex];
    $('quiz-progress').textContent = `Question ${state.quizIndex + 1} of ${quizQuestions.length}`;
    $('quiz-question').textContent = question.q;
    $('quiz-feedback').textContent = 'Choose the best answer.';
    $('quiz-next').hidden = true;
    const options = $('quiz-options');
    options.replaceChildren();

    question.o.forEach((text, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.addEventListener('click', () => {
        [...options.children].forEach((item) => { item.disabled = true; });
        if (index === question.a) {
          button.classList.add('correct');
          state.quizScore += 1;
          $('quiz-feedback').textContent = 'Correct! Well done.';
        } else {
          button.classList.add('wrong');
          options.children[question.a].classList.add('correct');
          $('quiz-feedback').textContent = `Not quite. Correct answer: ${question.o[question.a]}.`;
        }
        $('quiz-next').hidden = false;
      });
      options.appendChild(button);
    });
  }

  function nextQuiz() {
    state.quizIndex += 1;
    if (state.quizIndex < quizQuestions.length) {
      renderQuiz();
      return;
    }
    state.stats.coins += state.quizScore * 20;
    state.stats.boxes += state.quizScore >= 2 ? 1 : 0;
    $('quiz-question').textContent = `Assignment complete: ${state.quizScore}/${quizQuestions.length}`;
    $('quiz-options').replaceChildren();
    $('quiz-feedback').textContent = `Reward: ${state.quizScore * 20} coins${state.quizScore >= 2 ? ' and 1 Buddy Box' : ''}.`;
    $('quiz-next').hidden = true;
    updateMenu();
    setTimeout(() => closePanel('quiz-panel'), 1600);
  }

  function updateMenu() {
    render2DPreview();
    $('menu-name').textContent = state.profile.name;
    $('menu-level').textContent = `Year ${state.profile.year} · New Student`;
    $('stat-boxes').textContent = state.stats.boxes;
    $('stat-stars').textContent = state.stats.stars;
    $('stat-coins').textContent = state.stats.coins;
    $('online-button').querySelector('span').textContent = state.online ? 'Online Connected' : state.connecting ? 'Connecting…' : 'Connect Online';
    updateZoneLabel();
  }

  function endpoint() {
    return $('server-url').value.trim();
  }

  function normalizeEndpoint(raw) {
    const value = String(raw || '').trim();
    if (!/^wss?:\/\//i.test(value)) return '';
    const url = new URL(value);
    if (!/\/ws\/?$/i.test(url.pathname)) url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`;
    url.searchParams.set('room', $('server-room').value.trim() || 'schoolyard-main');
    return url.toString();
  }

  function clearConnectionTimer() {
    if (connectionTimer) clearTimeout(connectionTimer);
    connectionTimer = 0;
  }

  function setOnlineStatus(text) {
    $('online-status').textContent = text;
    updateMenu();
  }

  function connect() {
    if (state.online || state.connecting) return;
    const url = normalizeEndpoint(endpoint());
    if (!url) {
      setOnlineStatus('Enter a valid wss:// Worker address.');
      return;
    }

    const room = $('server-room').value.trim() || 'schoolyard-main';
    localStorage.setItem(ENDPOINT_KEY, endpoint());
    localStorage.setItem(ROOM_KEY, room);
    disconnect(false);
    state.connecting = true;
    setOnlineStatus('Connecting to the online server…');

    let socket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      state.connecting = false;
      setOnlineStatus(`Could not open WebSocket: ${error.message || 'invalid endpoint'}`);
      return;
    }

    state.socket = socket;
    clearConnectionTimer();
    connectionTimer = setTimeout(() => {
      if (state.socket !== socket || socket.readyState === WebSocket.OPEN) return;
      try { socket.close(4000, 'Connection timeout'); } catch (_) {}
      state.connecting = false;
      setOnlineStatus('Connection timed out. Local mode is still available.');
    }, 10000);

    socket.addEventListener('open', () => {
      if (state.socket !== socket) return;
      clearConnectionTimer();
      state.connecting = false;
      state.online = true;
      setOnlineStatus('Connected. Other players can now appear.');
      send('join', {
        name: state.profile.name,
        appearance: appearancePayload(),
        profile: { achievementLevel: 1, achievementTitle: 'New Student' },
        state: {
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          rotationY: player.rotation.y,
          zone: state.zone
        },
        clientVersion: BUILD
      });
    });

    socket.addEventListener('message', (event) => handleMessage(event.data));
    socket.addEventListener('close', (event) => {
      if (state.socket !== socket) return;
      clearConnectionTimer();
      state.socket = null;
      state.connecting = false;
      state.online = false;
      state.ownId = '';
      clearRemotePlayers();
      setOnlineStatus(event.code === 1000 ? 'Offline mode' : 'Disconnected. Local mode remains available.');
    });
    socket.addEventListener('error', () => {
      if (state.socket !== socket) return;
      state.connecting = false;
      setOnlineStatus('Connection failed. Check the Worker URL or network.');
    });
  }

  function disconnect(showStatus = true) {
    clearConnectionTimer();
    const socket = state.socket;
    state.socket = null;
    state.connecting = false;
    state.online = false;
    state.ownId = '';
    if (socket) {
      try {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'leave', payload: {}, timestamp: Date.now() }));
        socket.close(1000, 'Player disconnected');
      } catch (_) {}
    }
    clearRemotePlayers();
    if (showStatus) setOnlineStatus('Offline mode');
    else updateMenu();
  }

  function send(type, payload = {}) {
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return false;
    try {
      state.socket.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
      return true;
    } catch (_) {
      return false;
    }
  }

  function handleMessage(raw) {
    if (raw === 'pong') return;
    let message;
    try { message = JSON.parse(raw); } catch (_) { return; }
    const payload = message.payload || {};

    if (message.type === 'welcome') {
      state.ownId = payload.playerId;
      (payload.players || []).forEach(upsertRemote);
      setOnlineStatus(`Connected · ${payload.onlineCount || 1} online`);
    }
    if (['player_joined', 'player_state', 'appearance_update', 'profile_update'].includes(message.type)) upsertRemote(payload);
    if (message.type === 'player_left') removeRemote(payload.playerId);
    if (message.type === 'chat') {
      state.chat.push({ name: payload.name || 'Student', text: payload.text || '' });
      renderChat();
    }
    if (message.type === 'presence') setOnlineStatus(`Connected · ${payload.onlineCount || 1} online`);
    if (message.type === 'error') setOnlineStatus(payload.message || 'Server error.');
  }

  function upsertRemote(payload) {
    const id = payload.id || payload.playerId;
    if (!id || id === state.ownId || !scene) return;
    let remote = state.remotePlayers.get(id);
    if (!remote) {
      const profile = {
        name: payload.name || 'Student',
        gender: payload.appearance?.gender || 'female',
        skin: payload.appearance?.skin || skinColors[1],
        headwear: payload.appearance?.headwear || (payload.appearance?.gender === 'male' ? headwearColors[6] : headwearColors[0]),
        shirt: payload.appearance?.shirt || shirtColors[0],
        pants: payload.appearance?.pants || pantsColors[1],
        shoes: payload.appearance?.shoes || shoeColors[4],
        bag: payload.appearance?.backpack || payload.appearance?.bag || bagColors[1]
      };
      remote = {
        group: makeCharacter(profile, true),
        target: new THREE.Vector3(),
        zone: payload.state?.zone || payload.zone || 'plaza'
      };
      scene.add(remote.group);
      state.remotePlayers.set(id, remote);
    }
    if (payload.appearance) applyAppearanceToGroup(remote.group, { ...payload.appearance, gender: payload.appearance.gender || 'female' });
    const remoteState = payload.state || payload;
    if (Number.isFinite(Number(remoteState.x))) {
      remote.target.set(Number(remoteState.x), Number(remoteState.y) || 0, Number(remoteState.z) || 0);
      remote.group.rotation.y = Number(remoteState.rotationY) || 0;
    }
    remote.zone = remoteState.zone || remote.zone;
    remote.group.visible = remote.zone === state.zone;
  }

  function updateRemoteInterpolation(delta) {
    state.remotePlayers.forEach((remote) => {
      remote.group.visible = remote.zone === state.zone;
      remote.group.position.lerp(remote.target, Math.min(1, delta * 8));
    });
  }

  function removeRemote(id) {
    const remote = state.remotePlayers.get(id);
    if (!remote) return;
    scene?.remove(remote.group);
    state.remotePlayers.delete(id);
  }

  function clearRemotePlayers() {
    [...state.remotePlayers.keys()].forEach(removeRemote);
  }

  function renderChat() {
    const log = $('chat-log');
    log.innerHTML = state.chat.length
      ? state.chat.slice(-80).map((entry) => `<div class="chat-line"><b>${escapeHtml(entry.name)}:</b> ${escapeHtml(entry.text)}</div>`).join('')
      : '<div class="chat-line">System: Connect to the online server to chat.</div>';
    log.scrollTop = log.scrollHeight;
    $('chat-status').textContent = state.online ? 'Online' : 'Offline';
  }

  function sendChat() {
    const inputElement = $('chat-input');
    const text = inputElement.value.trim();
    if (!text) return;
    if (!state.online) {
      state.chat.push({ name: 'System', text: 'Connect to the online server first.' });
      renderChat();
      return;
    }
    if (send('chat', { text })) inputElement.value = '';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function boot() {
    setupProfileUI();
    $('server-url').value = localStorage.getItem(ENDPOINT_KEY) || config.websocketUrl || '';
    $('server-room').value = localStorage.getItem(ROOM_KEY) || config.defaultRoom || 'schoolyard-main';
    $('shadow-toggle').checked = state.settings.shadows;
    $('traffic-toggle').checked = state.settings.traffic;
    buildCharacterEditor();
    $('boot-retry').onclick = () => location.reload();

    setBootStatus('Ready. Opening lightweight Adventure Setup…');
    setTimeout(() => setScreen('setup'), 80);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker unavailable:', error));
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => disconnect(false), { once: true });
  window.addEventListener('unhandledrejection', (event) => console.error('[Schoolyard Mobile] Unhandled promise rejection:', event.reason));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
