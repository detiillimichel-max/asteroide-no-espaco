(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });

    const scoreEl = document.getElementById('score');
    const highEl = document.getElementById('high');
    const levelEl = document.getElementById('level');
    const livesEl = document.getElementById('lives');
    const centerMsg = document.getElementById('centerMsg');

    const SHIP_SIZE = 18;
    const TURN_SPEED = 0.08;
    const THRUST = 0.15;
    const FRICTION = 0.99;
    const BULLET_SPEED = 7;
    const BULLET_LIFE = 60;

    let ship, bullets = [], asteroids = [], particles = [], stars = [];
    let score = 0, high = +localStorage.getItem('ast_high') || 0, lives = 3, level = 1;
    let gameState = 'start', invuln = 0, fireCooldown = 0, shake = 0, lastTime = 0;
    const input = { left:false, right:false, thrust:false, fire:false };

    highEl.textContent = high;

    for (let i=0;i<150;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3,a:Math.random()*0.5+0.3,tw:Math.random()*Math.PI*2});

    function wrap(o){ if(o.x<-50)o.x=W+50; if(o.x>W+50)o.x=-50; if(o.y<-50)o.y=H+50; if(o.y>H+50)o.y=-50; }
    function rand(min,max){ return Math.random()*(max-min)+min; }

    function spawnShip(){
        ship = { x:W/2, y:H/2, vx:0, vy:0, angle:-Math.PI/2, alive:true };
        invuln = 120;
    }
    function resetGame(){
        score=0; lives=3; level=1; bullets=[]; particles=[]; asteroids=[];
        spawnShip(); spawnAsteroids(4); updateHUD();
    }
    function updateHUD(){
        scoreEl.textContent = score;
        levelEl.textContent = `Level ${level}`;
        livesEl.innerHTML = '';
        for(let i=0;i<lives;i++){
            const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
            s.setAttribute('viewBox','0 0 24 24'); s.classList.add('life');
            s.innerHTML = '<path fill="none" stroke="#e8f0ff" stroke-width="2" d="M12 4l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"/>';
            livesEl.appendChild(s);
        }
    }
    function addScore(v){ score+=v; if(score>high){ high=score; localStorage.setItem('ast_high',high); highEl.textContent=high; } }

    function makeAsteroid(x,y,size){
        const r = size===3?45:size===2?28:16;
        const pts=[]; const n=10+Math.floor(Math.random()*4);
        for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; const rad=r*rand(0.75,1.15); pts.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad}); }
        return { x,y,vx:rand(-1.5,1.5),vy:rand(-1.5,1.5),angle:0,spin:rand(-0.02,0.02),r,size,points:pts };
    }
    function spawnAsteroids(n){
        asteroids=[];
        for(let i=0;i<n;i++){
            let x,y;
            do{ x=rand(0,W); y=rand(0,H); }while(Math.hypot(x-ship.x,y-ship.y)<150);
            asteroids.push(makeAsteroid(x,y,3));
        }
    }
    function splitAsteroid(idx){
        const a=asteroids[idx];
        explode(a.x,a.y,'#b8c7ff',20);
        asteroids.splice(idx,1);
        if(a.size>1){
            for(let i=0;i<2;i++){
                const na=makeAsteroid(a.x,a.y,a.size-1);
                na.vx=a.vx+rand(-1,1); na.vy=a.vy+rand(-1,1);
                asteroids.push(na);
            }
        }
    }
    function explode(x,y,color,n){
        for(let i=0;i<n;i++) particles.push({x,y,vx:rand(-3,3),vy:rand(-3,3),life:30, size:rand(1,3), color});
    }
    function fireBullet(){
        if(!ship.alive||fireCooldown>0||gameState!=='playing')return;
        fireCooldown=10;
        bullets.push({x:ship.x+Math.cos(ship.angle)*SHIP_SIZE,y:ship.y+Math.sin(ship.angle)*SHIP_SIZE,vx:Math.cos(ship.angle)*BULLET_SPEED+ship.vx*0.3,vy:Math.sin(ship.angle)*BULLET_SPEED+ship.vy*0.3,life:BULLET_LIFE});
    }
    function shipHit(){
        if(invuln>0||!ship.alive)return;
        ship.alive=false; explode(ship.x,ship.y,'#ff5c7a',40); shake=16; lives--; updateHUD();
        if(lives<=0){
            gameState='gameover';
            centerMsg.innerHTML=`<div class="title">GAME OVER</div><div class="subtitle">Score ${score}</div><div class="hint pulse">Press Fire to Restart</div>`;
            centerMsg.style.display='block';
        }else{
            gameState='dead';
            setTimeout(()=>{ spawnShip(); gameState='playing'; },1200);
        }
    }
    function startGame(){ resetGame(); gameState='playing'; centerMsg.style.display='none'; }

    function update(){
        if(gameState==='playing' && ship.alive){
            if(input.left) ship.angle-=TURN_SPEED;
            if(input.right) ship.angle+=TURN_SPEED;
            if(input.thrust){ ship.vx+=Math.cos(ship.angle)*THRUST; ship.vy+=Math.sin(ship.angle)*THRUST; }
            ship.vx*=FRICTION; ship.vy*=FRICTION;
            ship.x+=ship.vx; ship.y+=ship.vy; wrap(ship);
            if(invuln>0) invuln--;
        }
        for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.x+=b.vx; b.y+=b.vy; b.life--; wrap(b); if(b.life<=0)bullets.splice(i,1); }
        for(const a of asteroids){ a.x+=a.vx; a.y+=a.vy; a.angle+=a.spin; wrap(a); }
        for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=0.98; p.vy*=0.98; p.life--; if(p.life<=0)particles.splice(i,1); }

        for(let i=bullets.length-1;i>=0;i--){
            const b=bullets[i];
            for(let j=asteroids.length-1;j>=0;j--){
                const a=asteroids[j];
                if((b.x-a.x)**2+(b.y-a.y)**2 < a.r*a.r){ bullets.splice(i,1); splitAsteroid(j); addScore(a.size===3?20:a.size===2?50:100); break; }
            }
        }
        if(gameState==='playing' && ship.alive && invuln===0){
            for(const a of asteroids){ if((ship.x-a.x)**2+(ship.y-a.y)**2 < (a.r+SHIP_SIZE*0.6)**2){ shipHit(); break; } }
        }
        if(gameState==='playing' && asteroids.length===0){ level++; spawnAsteroids(3+level); updateHUD(); }
        if(fireCooldown>0) fireCooldown--;
        if(shake>0) shake--;
        if(input.fire){ if(gameState==='start'||gameState==='gameover') startGame(); else fireBullet(); }
    }

    function draw(){
        ctx.save();
        if(shake>0) ctx.translate((Math.random()-0.5)*shake*0.5,(Math.random()-0.5)*shake*0.5);
        ctx.clearRect(0,0,W,H);
        for(const s of stars){ s.tw+=0.02; ctx.globalAlpha=s.a*(0.7+Math.sin(s.tw)*0.3); ctx.fillStyle='#cfe6ff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
        ctx.globalAlpha=1;
        for(const p of particles){ ctx.globalAlpha=Math.max(0,p.life/30); ctx.fillStyle=p.color||'#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); }
        ctx.globalAlpha=1;
        ctx.strokeStyle='#e8f0ff'; ctx.lineWidth=2; ctx.shadowColor='#6ee7ff'; ctx.shadowBlur=8;
        for(const b of bullets){ ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.3,b.y-b.vy*0.3); ctx.stroke(); }
        ctx.shadowBlur=0;
        ctx.lineWidth=2; ctx.strokeStyle='#b8c7ff'; ctx.fillStyle='rgba(20,30,60,0.35)';
        for(const a of asteroids){ ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.angle); ctx.beginPath(); ctx.moveTo(a.points[0].x,a.points[0].y); for(let i=1;i<a.points.length;i++)ctx.lineTo(a.points[i].x,a.points[i].y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        if(ship && ship.alive){
            ctx.save(); ctx.translate(ship.x,ship.y); ctx.rotate(ship.angle);
            const blink=invuln>0 && (Math.floor(invuln/5)%2===0);
            if(!blink){
                ctx.strokeStyle='#e8f0ff'; ctx.lineWidth=2.5; ctx.shadowColor='#6ee7ff'; ctx.shadowBlur=16;
                ctx.beginPath(); ctx.moveTo(SHIP_SIZE,0); ctx.lineTo(-SHIP_SIZE*0.7,-SHIP_SIZE*0.7); ctx.lineTo(-SHIP_SIZE*0.4,0); ctx.lineTo(-SHIP_SIZE*0.7,SHIP_SIZE*0.7); ctx.closePath(); ctx.stroke();
                ctx.fillStyle='rgba(110,231,255,0.25)'; ctx.beginPath(); ctx.arc(2,0,4,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
                if(input.thrust){ ctx.fillStyle='#6ee7ff'; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.moveTo(-SHIP_SIZE*0.7,-4); ctx.lineTo(-SHIP_SIZE*1.4-Math.random()*4,0); ctx.lineTo(-SHIP_SIZE*0.7,4); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1; }
            }
            ctx.restore();
        }
        ctx.restore();
    }

    function loop(t){ lastTime=t; update(); draw(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);

    const btns={ left:document.getElementById('btn-left'), right:document.getElementById('btn-right'), thrust:document.getElementById('btn-thrust'), fire:document.getElementById('btn-fire') };
    function bind(el,name){ const on=e=>{e.preventDefault();input[name]=true;el.classList.add('active')}; const off=e=>{e.preventDefault();input[name]=false;el.classList.remove('active')}; el.addEventListener('pointerdown',on); el.addEventListener('pointerup',off); el.addEventListener('pointerleave',off); el.addEventListener('pointercancel',off); }
    bind(btns.left,'left'); bind(btns.right,'right'); bind(btns.thrust,'thrust'); bind(btns.fire,'fire');

    window.addEventListener('keydown',e=>{ const k=e.code; if(['ArrowLeft','KeyA'].includes(k))input.left=true; if(['ArrowRight','KeyD'].includes(k))input.right=true; if(['ArrowUp','KeyW'].includes(k))input.thrust=true; if(['Space','Enter'].includes(k))input.fire=true; if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault(); });
    window.addEventListener('keyup',e=>{ const k=e.code; if(['ArrowLeft','KeyA'].includes(k))input.left=false; if(['ArrowRight','KeyD'].includes(k))input.right=false; if(['ArrowUp','KeyW'].includes(k))input.thrust=false; if(['Space','Enter'].includes(k))input.fire=false; });

    document.addEventListener('touchmove',e=>{ if(e.target.closest('.btn'))e.preventDefault(); },{passive:false});
    updateHUD(); centerMsg.style.display='block';
})();
