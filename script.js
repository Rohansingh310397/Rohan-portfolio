(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const menu = $(".menu-toggle"), nav = $(".nav");
  menu?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "×" : "☰";
  });
  $$(".nav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open"); menu?.setAttribute("aria-expanded","false"); if(menu) menu.textContent="☰";
  }));
  const progress = $("#progress");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if(progress) progress.style.width = (max > 0 ? scrollY/max*100 : 0) + "%";
  };
  addEventListener("scroll", updateProgress, {passive:true}); updateProgress();

  const sections = $$("main section[id]");
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#"+entry.target.id));
      }
    }), {rootMargin:"-35% 0px -55% 0px"});
    sections.forEach(s => observer.observe(s));
    const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if(e.isIntersecting){e.target.classList.add("visible"); revealObserver.unobserve(e.target);}
    }), {threshold:.08});
    $$(".project,.ai-group,.timeline article,.skill-card,.highlights div").forEach(el => {
      el.classList.add("reveal"); revealObserver.observe(el);
    });
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.THREE) {
    document.body.classList.add("no-webgl");
    return;
  }
  const THREE = window.THREE;
  const scenes = [];
  const palette = {olive:0x526a3e, deep:0x263a27, sage:0xaab894, cream:0xf2efe5, gold:0xb78b5d, ink:0x344234};

  function setup(id, make, opts={}) {
    const canvas = document.getElementById(id);
    if(!canvas) return;
    let renderer, scene, camera, group, pointer={x:0,y:0};
    try {
      renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:"low-power"});
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
      renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(opts.fov || 38, 1, .1, 100);
      camera.position.z = opts.cameraZ || 8;
      group = new THREE.Group(); scene.add(group);
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const key = new THREE.PointLight(0xffffff, 2.2); key.position.set(4,5,7); scene.add(key);
      make(scene, group);
    } catch(e) { return; }
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener("resize", resize, {passive:true});
    canvas.addEventListener("pointermove", e => {
      const r=canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width-.5)*2; pointer.y=((e.clientY-r.top)/r.height-.5)*2;
    });
    canvas.addEventListener("pointerleave",()=>{pointer.x=0;pointer.y=0;});
    const clock = new THREE.Clock();
    const tick = () => {
      const t=clock.getElapsedTime();
      if(!reduced) {
        group.rotation.y += (pointer.x*.12-group.rotation.y)*.018;
        group.rotation.x += (-pointer.y*.08-group.rotation.x)*.018;
        if(opts.animate) opts.animate(group,t);
      }
      renderer.render(scene,camera);
      requestAnimationFrame(tick);
    };
    tick(); scenes.push({renderer,scene,camera});
  }

  function particleOrb(scene, group, count=1000, radius=2.15, color=palette.olive) {
    const positions = new Float32Array(count*3);
    const colors = new Float32Array(count*3);
    const c1 = new THREE.Color(color), c2 = new THREE.Color(0xb4a17b);
    for(let i=0;i<count;i++){
      const u=Math.random(), v=Math.random(), theta=2*Math.PI*u, phi=Math.acos(2*v-1);
      const r=radius*(.88+Math.random()*.18);
      positions[i*3]=r*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1]=r*Math.cos(phi);
      positions[i*3+2]=r*Math.sin(phi)*Math.sin(theta);
      const c=c1.clone().lerp(c2,Math.random()*.55);
      colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
    }
    const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.BufferAttribute(positions,3)); geo.setAttribute("color",new THREE.BufferAttribute(colors,3));
    const mat=new THREE.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.9,depthWrite:false});
    group.add(new THREE.Points(geo,mat));
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(radius*.58,2),new THREE.MeshPhysicalMaterial({color:0xdce4ce,metalness:.16,roughness:.24,transparent:true,opacity:.42,clearcoat:1}));
    group.add(core);
    [0,1,2].forEach((i)=>{const torus=new THREE.Mesh(new THREE.TorusGeometry(radius*(.82+i*.1),.008,8,180),new THREE.MeshBasicMaterial({color:i===1?0xb78b5d:0x82936b,transparent:true,opacity:.55}));torus.rotation.set(.7+i*.35,.3+i*.5,.4);group.add(torus);});
  }

  setup("hero3d",(s,g)=>particleOrb(s,g,window.innerWidth<700?500:1250,2.05),{cameraZ:7.5,animate:(g,t)=>{g.rotation.y=t*.08;g.rotation.z=Math.sin(t*.2)*.06;}});
  setup("ai3d",(s,g)=>{
    particleOrb(s,g,700,1.75,0x647d4c);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2, r=2.25;
      const node=new THREE.Mesh(new THREE.SphereGeometry(.055,12,12),new THREE.MeshStandardMaterial({color:i%3===0?0xb78b5d:0x6d8653,emissive:0x263a27,emissiveIntensity:.3}));
      node.position.set(Math.cos(a)*r,Math.sin(a)*r*.72,Math.sin(a*2)*.35);g.add(node);
    }
  },{cameraZ:6.4,animate:(g,t)=>{g.rotation.y=t*.1;}});
  setup("flow3d",(s,g)=>{
    const pts=[[-2.6,0,0],[-.9,.65,0],[.8,-.5,0],[2.5,.2,0]];
    const mat=new THREE.MeshStandardMaterial({color:0x657d4b,metalness:.3,roughness:.25});
    pts.forEach((p,i)=>{
      const node=new THREE.Mesh(new THREE.IcosahedronGeometry(i===0||i===3?.38:.48,2),new THREE.MeshPhysicalMaterial({color:i===1?0xd9dfca:0x647b4d,metalness:.25,roughness:.2,clearcoat:1}));
      node.position.set(...p);g.add(node);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.57,.018,8,80),new THREE.MeshBasicMaterial({color:0xb58b5e,transparent:true,opacity:.7}));
      ring.position.set(...p);ring.rotation.x=.8;g.add(ring);
    });
    for(let i=0;i<3;i++){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pts[i]),new THREE.Vector3(...pts[i+1])]);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x8b9b72,transparent:true,opacity:.8})))}
    const cube=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,.35),mat);cube.position.set(0,1.2,.2);g.add(cube);
  },{cameraZ:7.3,animate:(g,t)=>{g.children.forEach((o,i)=>{if(o.geometry?.type==="IcosahedronGeometry")o.position.y += Math.sin(t*1.2+i)*.0008;});}});
  setup("experience3d",(s,g)=>{
    for(let i=0;i<14;i++){
      const h=.35+Math.random()*1.25, x=(i-6.5)*.42;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.19,h,.18),new THREE.MeshPhysicalMaterial({color:i%3===0?0xb78b5d:0x6b8053,metalness:.25,roughness:.3,clearcoat:.6}));
      bar.position.set(x,-.65+h/2,(Math.random()-.5)*.5);g.add(bar);
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,.012,8,180),new THREE.MeshBasicMaterial({color:0x81916a,transparent:true,opacity:.65}));ring.rotation.x=1.15;g.add(ring);
  },{cameraZ:7,animate:(g,t)=>{g.rotation.y=Math.sin(t*.25)*.18;}});
  setup("contact3d",(s,g)=>{
    const core=new THREE.Mesh(new THREE.SphereGeometry(1.35,48,48),new THREE.MeshPhysicalMaterial({color:0xcbd7b9,metalness:.18,roughness:.12,transparent:true,opacity:.52,clearcoat:1,clearcoatRoughness:.08}));
    g.add(core);
    const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.82,2),new THREE.MeshStandardMaterial({color:0x60774b,metalness:.3,roughness:.28,wireframe:true,transparent:true,opacity:.65}));g.add(inner);
    for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.85+i*.23,.012,8,160),new THREE.MeshBasicMaterial({color:i===1?0xb78b5d:0x7c9065,transparent:true,opacity:.75}));ring.rotation.set(.7+i*.42,.5+i*.35,.25);g.add(ring);}
    for(let i=0;i<4;i++){const panel=new THREE.Mesh(new THREE.BoxGeometry(.42,.32,.055),new THREE.MeshPhysicalMaterial({color:0xf3f1e7,metalness:.1,roughness:.25,transparent:true,opacity:.85}));const a=i*Math.PI/2;panel.position.set(Math.cos(a)*2.25,Math.sin(a)*1.25,.2);panel.rotation.z=a;g.add(panel);}
  },{cameraZ:7.5,animate:(g,t)=>{g.rotation.y=t*.07;}});
})();