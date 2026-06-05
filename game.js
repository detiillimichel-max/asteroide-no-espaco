(()=>{const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');let W=canvas.width=innerWidth,H=canvas.height=innerHeight;addEventListener('resize',()=>{W=canvas.width=innerWidth;H=canvas.height=innerHeight});
const scoreEl=document.getElementById('score'),highEl=document.getElementById('high'),levelEl=document.getElementById('level'),livesEl=document.getElementById('lives'),centerMsg=document.getElementById('centerMsg');
const SHIP_SIZE=18,TURN_SPEED=.08,THRUST=.15,FRICTION=.99,BULLET_SPEED=7,BULLET_LIFE=60;
let ship,bullets=[],asteroids=[],particles=[],stars=[];let score=0,high=+localStorage.getItem('ast_high')||0,lives=3,level=1,gameState='start',invuln=0,fireCooldown=0,shake=0,lastTime=0;
const input={left:false,right:false,thrust:false,fire:false};highEl.textContent=high;
for(let i=0;i<150;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.3,a:Math.random()*.5+.3,tw:Math.random()*Math.PI*2});
const wrap=o=>{
