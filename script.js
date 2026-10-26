import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07CEEB);
scene.fog = new THREE.FogExp2(0x07CEEB, 0.015);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0,25,35);
camera.lookAt(0,0,0);


const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference:"high-performance"});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunlight = new THREE.SpotLight(0xfff5e6, 1.1);
sunlight.position.set(22,50,30);
sunlight.angle;
sunlight.castShadow = true;
sunlight.penumbra = 0.5;
sunlight.shadow.mapSize.width = 1024;
sunlight.shadow.mapSize.height = 1024;
scene.add(sunlight);

// this is the platform that the snake will crawl on
const floorGeo = new THREE.PlaneGeometry(80,80); // Dimentions of the platform
const floorMat = new THREE.MeshStandardMaterial({color: 0x3a7a3a, roughness: 1.0}); // Color and texture
const floor = new THREE.Mesh(floorGeo, floorMat); // Combining both the dimentions and physical properties
floor.rotation.x = -Math.PI/2;
floor.position.y = -0.55;
floor.receiveShadow = true;
scene.add(floor); // Adding the platoform "floor" to canvas

const gridSize = 20;

const playBox = new THREE.BoxGeometry(gridSize, 0.25, gridSize); // Specific area snake can crawl
const playBoxLine = new THREE.BoxHelper(new THREE.Mesh(playBox), 0xffffff); // The outline for deferenciation
playBoxLine.position.y = 0.2
scene.add(playBoxLine)

// Setting up objects that will in game
let snake = [];
let score = 0;
let rocks = [];

// The rules required for the game to function
let direction = {x: 1, z: 0};
let nextDirection = {x: 1, z: 0};
let jumpProgress = 0;
let isJumping = false;
let tickRate = 160;
let lastTick = 0;
let gameOver;

// Creating in game objects
const headMat = new THREE.MeshStandardMaterial({color: 0x1f4d1f, roughness: 0.7});
const bodyMat = new THREE.MeshStandardMaterial({color: 0x2d6a2d, roughness: 0.8});
const ratMat = new THREE.MeshStandardMaterial({color:  0x7a7a7a, roughness: 0.9});
const rockMat = new THREE.MeshStandardMaterial({color: 0x666666, roughness: 0.9, flatShading: true});

const treeMat = new THREE.MeshStandardMaterial({color: 0x4a3b2c, roughness: 1.0});
const leafMat = new THREE.MeshStandardMaterial({color: 0x228B22, roughness: 0.8, flatShading: true});

// This is responsible for dimentions and shape
const treeGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 6);
const leafGeo = new THREE.DodecahedronGeometry(2.5, 0);
const CubeGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
const ratGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
const rockGeo = new THREE.DodecahedronGeometry(0.6)

// Creats the rats
let rat = {x: 5, z: 0, mesh: new THREE.Mesh(ratGeo, ratMat)};
 rat.mesh.castShadow = true;
 scene.add(rat.mesh);

 // Spawns the rocks
 function spawnRock(){
    let rx = Math.floor(Math.random()*gridSize)-gridSize/2;
    let rz = Math.floor(Math.random()*gridSize)-gridSize/2;
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.set(rx,0,rz);
    scene.add(rockMesh);
    rocks.push({x: rx, z: rz, mesh: rockMesh});
 }

 // spawns the rats
 function createRat() {
    let safe = false;
    while(!safe){
        safe = true;
        rat.x = Math.floor(Math.random()*gridSize)-gridSize/2;
        rat.z =  Math.floor(Math.random()*gridSize)-gridSize/2;
        for(let s of snake) if (s.x === rat.x && s.z === rat.z) safe = false;
        for (let r of rocks) if (r.x === rat.x && r.z === rat.z) safe = false;
    }
    rat.mesh.position.set(rat.x, 0, rat.z);
 }
 spawnRock()

// This is the function  responsible for putting the shape and color of the snake together
function createSnake(head) {
    const mesh = new THREE.Mesh(CubeGeo, head? headMat : bodyMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh; 
}

snake.push({x: 0, z: 0, mesh: createSnake(true)})

// Creats the trees
function creatTree(x,z){
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(treeGeo, treeMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 6.5;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    treeGroup.add(leaf);
    
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    return treeGroup;
}

// spawns trees
const treeSpread = 16; // how far apart each tree is
const treeNum = 100; // number of trees
for (let i = 0; i < treeNum; i++){
    let tx, tz;
    if (Math.random()> 0.5){
        tx = (Math.random() > 0.5 ? 1 : -1)*(gridSize/2+3+Math.random()*treeSpread);
        tz = (Math.random()-0.5)*(gridSize+treeSpread*2);
    }else{
        tz = (Math.random() > 0.5 ? 1 : -1)*(gridSize/2+3+Math.random()*treeSpread);
        tx = (Math.random()-0.5)*(gridSize+treeSpread*2);
    }
    creatTree(tx, tz)
}

// Lets user control snake using keyboard
window.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowUp" || e.key === "w") && direction.z === 0) nextDirection = {x:0, z: -1};
    if ((e.key === "ArrowDown" || e.key === "s") && direction.z === 0) nextDirection = {x:0, z: 1};
    if ((e.key === "ArrowLeft" || e.key === "a") && direction.x === 0) nextDirection = {x:-1, z: 0};
    if ((e.key === "ArrowRight" || e.key === "d") && direction.x === 0) nextDirection = {x:1, z: 0};

    if (e.key === ' ' && !isJumping){
        isJumping = true;
        jumpProgress = 0;
    }
});

// Incharge of the core mechanics of the snakes movement
function movement() {

    direction = nextDirection;
    const currentHead = snake[0];
    let yP =isJumping && jumpProgress > 0.2 && jumpProgress < 0.8 ? 1:0;

const nextX = currentHead.x + direction.x;
const nextZ = currentHead.z + direction.z;

const newHead = {
    x: nextX,
    z: nextZ,
    vP: yP,
    mesh: createSnake(true)
}
newHead.mesh.position.copy(currentHead.mesh.position);
snake.unshift(newHead);
snake[1].mesh.material = bodyMat;

if (newHead.x === rat.x && newHead.z === rat.z){
 score += 1;
 createRat();
 spawnRock();
}else{
    const endOfSnake = snake.pop();
    scene.remove(endOfSnake.mesh)
}
}

// Takes care of the attual movement 
function animate(time){
    requestAnimationFrame(animate);
    renderer.render(scene, camera)
 

    if ( time-lastTick > tickRate){
        lastTick = time;
        movement();
    }

    if (isJumping){
        jumpProgress += 0.08;
        if (jumpProgress > 1){
            isJumping = false;
            jumpProgress = 0;
        }
    }
    for(let i = 0; i < snake.length; i++){
        const s = snake[i]
        s.mesh.position.x += (s.x- s.mesh.position.x)*0.2;
        s.mesh.position.z += (s.z- s.mesh.position.z)*0.2;
   
    if(isJumping && i === 0){
        const jumpH = Math.sin(jumpProgress*Math.PI)*1;
        s.mesh.position.y += (jumpH - s.mesh.position.y)* 0.3;
    }else{
        s.mesh.position.y += (0 - s.mesh.position.y)*1;
    }
    }

    // This code is for the camera tracking, it tracks the movment of the snake, so where the snake geos the camera follows
    if (snake.length > 0 && !gameOver){
        const headOfSnake = snake[0].mesh;

        const camDistanceX = headOfSnake.position.x + 0;
        const camDistanceY = headOfSnake.position.y + 17;
        const camDistanceZ = headOfSnake.position.z + 20;

        camera.position.x += (camDistanceX - camera.position.x)*0.01;
        camera.position.y += (camDistanceY - camera.position.y)*0.01;
        camera.position.z += (camDistanceZ - camera.position.z)*0.01;

       camera.lookAt(headOfSnake.position.x, 0, headOfSnake.position.z) ;
    }
} 

animate(0);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})
//