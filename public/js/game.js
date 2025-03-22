import * as THREE from 'three';

// Game state
let score = 0;
let health = 100;
let gameOver = false;
let engineGlowTime = 0; // For pulsing engine effect
let targetPointer = null; // For aiming assistance
let lastShotTime = 0; // Moved outside animation loop
const shootCooldown = 1000; // 1 second between shots
let player = null; // Declare player as global variable

// Game controls
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

// Create spaceship function
function createSpaceship() {
    const shipGroup = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3366cc,
        shininess: 100,
        specular: 0x111111
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);

    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x66ccff,
        shininess: 150,
        opacity: 0.7,
        transparent: true
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.3;
    cockpit.position.z = -1;
    shipGroup.add(cockpit);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3366cc,
        shininess: 100
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1, 0, 0);
    leftWing.rotation.z = Math.PI / 6;
    shipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1, 0, 0);
    rightWing.rotation.z = -Math.PI / 6;
    shipGroup.add(rightWing);

    // Engine glow - adjusted to match spacecraft size and position
    const engineGeometry = new THREE.ConeGeometry(0.4, 1.2, 16);
    const engineMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.8
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.z = 2.5; // Moved to align with tail
    engine.rotation.x = Math.PI / 2;
    engine.userData.isEngine = true;
    shipGroup.add(engine);

    return shipGroup;
}

// Enemy ships and asteroids
const enemies = [];
let lastSpawnTime = 0; // Track time between spawns

// Create random asteroid shape
function createRandomAsteroid() {
    const asteroidGroup = new THREE.Group();
    
    // Create base shape using random geometry
    const baseShapes = [
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.OctahedronGeometry(1.2),
        new THREE.DodecahedronGeometry(1.2),
        new THREE.IcosahedronGeometry(1.2)
    ];
    
    const baseGeometry = baseShapes[Math.floor(Math.random() * baseShapes.length)];
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    asteroidGroup.add(base);
    
    // Add random bumps to make it look more like a rock
    for (let i = 0; i < 3; i++) {
        const bumpGeometry = new THREE.SphereGeometry(0.3, 4, 4);
        const bumpMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x909090,
            roughness: 0.9,
            metalness: 0.1
        });
        const bump = new THREE.Mesh(bumpGeometry, bumpMaterial);
        
        // Random position on the surface
        bump.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        asteroidGroup.add(bump);
    }
    
    // Random rotation
    asteroidGroup.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    return asteroidGroup;
}

// Create alien spaceship
function createAlienShip() {
    const shipGroup = new THREE.Group();
    
    // Main body - central fuselage
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x93C7EF,  // Light blue like in SVG
        shininess: 90
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Front nose cone
    const noseGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x93C7EF,
        shininess: 100
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.z = -2;
    nose.rotation.x = -Math.PI / 2;
    shipGroup.add(nose);
    
    // Side boosters
    const boosterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const boosterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3C5D76,  // Darker blue from SVG
        shininess: 80
    });
    
    // Left booster
    const leftBooster = new THREE.Mesh(boosterGeometry, boosterMaterial);
    leftBooster.position.set(-0.8, 0, 0);
    leftBooster.rotation.x = Math.PI / 2;
    shipGroup.add(leftBooster);
    
    // Right booster
    const rightBooster = new THREE.Mesh(boosterGeometry, boosterMaterial);
    rightBooster.position.set(0.8, 0, 0);
    rightBooster.rotation.x = Math.PI / 2;
    shipGroup.add(rightBooster);
    
    // Engine section
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({
        color: 0x1E2E3B,  // Dark blue from SVG
        shininess: 70
    });
    
    // Main engine
    const mainEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    mainEngine.position.z = 1.7;
    mainEngine.rotation.x = Math.PI / 2;
    shipGroup.add(mainEngine);
    
    // Booster engines
    const leftEngine = mainEngine.clone();
    leftEngine.position.set(-0.8, 0, 1.2);
    shipGroup.add(leftEngine);
    
    const rightEngine = mainEngine.clone();
    rightEngine.position.set(0.8, 0, 1.2);
    shipGroup.add(rightEngine);
    
    // Engine glow effects
    const glowGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
    const glowMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFDA44,  // Yellow from SVG
        emissive: 0xFFDA44,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.6
    });
    
    // Add glow to all engines
    const enginePositions = [
        { x: 0, y: 0, z: 2 },      // Main engine
        { x: -0.8, y: 0, z: 1.5 }, // Left engine
        { x: 0.8, y: 0, z: 1.5 }   // Right engine
    ];
    
    enginePositions.forEach(pos => {
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(pos.x, pos.y, pos.z);
        glow.rotation.x = Math.PI / 2;
        shipGroup.add(glow);
    });
    
    // Add central window/cockpit
    const windowGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
    const windowMaterial = new THREE.MeshPhongMaterial({
        color: 0x1E2E3B,
        shininess: 150,
        opacity: 0.7,
        transparent: true
    });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 0.3, -1);
    window.rotation.x = Math.PI / 2;
    shipGroup.add(window);
    
    // Add fins
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.8, 0);
    finShape.lineTo(0, 0.6);
    finShape.lineTo(0, 0);
    
    const finGeometry = new THREE.ExtrudeGeometry(finShape, {
        steps: 1,
        depth: 0.1,
        bevelEnabled: false
    });
    
    const finMaterial = new THREE.MeshPhongMaterial({
        color: 0x3C5D76,
        shininess: 70
    });
    
    // Add four fins
    const finPositions = [
        { pos: [-0.5, -0.5, 0], rot: [0, 0, 0] },
        { pos: [0.5, -0.5, 0], rot: [0, 0, Math.PI] },
        { pos: [0, -0.5, -0.5], rot: [0, Math.PI/2, 0] },
        { pos: [0, -0.5, 0.5], rot: [0, -Math.PI/2, 0] }
    ];
    
    finPositions.forEach(({pos, rot}) => {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(...pos);
        fin.rotation.set(...rot);
        shipGroup.add(fin);
    });
    
    // Scale and rotate the entire ship
    shipGroup.scale.set(0.4, 0.4, 0.4);
    shipGroup.rotation.y = Math.PI;
    
    return shipGroup;
}

// Bullets
const bullets = [];
const bulletGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Increased size and segments
const bulletMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.9
});

// Add after the bulletMaterial definition
const thrustParticleCount = 10;
const thrustParticleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const thrustParticleMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.8
});

// Add trail effect for bullets
function createBulletTrail() {
    const trailGeometry = new THREE.ConeGeometry(0.2, 1, 8);
    const trailMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.6
    });
    return new THREE.Mesh(trailGeometry, trailMaterial);
}

// Add raycaster for target pointer
const raycaster = new THREE.Raycaster();

// Add explosion particle system
function createExplosionParticles(position, color) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 1
            })
        );
        
        particle.position.copy(position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.userData.life = 1.0;
        particle.userData.decay = 0.02 + Math.random() * 0.02;
        
        particles.push(particle);
        scene.add(particle);
    }
    
    return particles;
}

// Game loop
function animate() {
    if (!gameOver) {
        requestAnimationFrame(animate);

        // Update engine glow effect with reduced scale changes
        engineGlowTime += 0.1;
        const pulseIntensity = Math.abs(Math.sin(engineGlowTime * 5)) * 2;
        
        // Update all engine materials with smaller scale changes
        player.traverse((child) => {
            if (child.userData.isEngine && child.material) {
                child.material.emissiveIntensity = pulseIntensity;
                child.scale.z = 0.8 + pulseIntensity * 0.4; // Reduced scale change
            }
        });

        // Update target pointer position and check for objects
        if (targetPointer) {
            targetPointer.position.x = player.position.x;
            targetPointer.position.y = player.position.y;
            
            // Make the pointer pulse more dramatically
            const pulseScale = 1 + Math.sin(engineGlowTime * 2) * 0.2;
            targetPointer.scale.set(pulseScale, pulseScale, 1);
            
            // Add rotation to make it more dynamic
            targetPointer.rotation.z = Math.sin(engineGlowTime) * 0.1;

            // Create a ray from the player's position
            const playerPosition = new THREE.Vector3();
            player.getWorldPosition(playerPosition);
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(player.quaternion);
            raycaster.set(playerPosition, direction);
            
            // Check for intersections with enemies and asteroids
            const intersects = raycaster.intersectObjects(scene.children, true);

            // Find the projection indicator
            const projection = targetPointer.children.find(child => child.userData.isProjection);
            if (projection) {
                if (intersects.length > 0) {
                    // Object detected in line of sight
                    const distance = intersects[0].distance;
                    projection.material.opacity = Math.max(0.2, 1 - distance / 20); // Fade based on distance
                    
                    // Check if the intersected object is an enemy
                    const isEnemy = enemies.some(enemy => enemy === intersects[0].object || enemy === intersects[0].object.parent);
                    if (isEnemy) {
                        projection.material.color.setHex(0xff0000); // Red for enemy
                    } else {
                        projection.material.color.setHex(0x00ff00); // Green for other objects
                    }
                } else {
                    // No object in line of sight
                    projection.material.opacity = 0;
                }
            }
        }

        // Player movement
        if (keys['ArrowLeft']) player.position.x -= 0.1;
        if (keys['ArrowRight']) player.position.x += 0.1;
        if (keys['ArrowUp']) player.position.y += 0.1;
        if (keys['ArrowDown']) player.position.y -= 0.1;

        // Add slight rotation when moving
        const targetRotationZ = keys['ArrowLeft'] ? 0.2 : keys['ArrowRight'] ? -0.2 : 0;
        player.rotation.z += (targetRotationZ - player.rotation.z) * 0.1;

        // Keep player in bounds
        player.position.x = Math.max(-5, Math.min(5, player.position.x));
        player.position.y = Math.max(-3, Math.min(3, player.position.y));

        // Spawn enemies
        const currentTime = Date.now();
        if (currentTime - lastSpawnTime > 2000) { // Spawn every 2 seconds
            const isAsteroid = Math.random() < 0.6; // 60% chance of asteroid, 40% chance of alien ship
            let enemy;
            
            if (isAsteroid) {
                enemy = createRandomAsteroid();
                enemy.speed = 0.03 + Math.random() * 0.02; // Random speed for asteroids
                enemy.rotationSpeed = (Math.random() - 0.5) * 0.02; // Random rotation
            } else {
                enemy = createAlienShip();
                enemy.speed = 0.05; // Fixed speed for alien ships
            }
            
            enemy.position.x = Math.random() * 10 - 5;
            enemy.position.z = -10;
            enemies.push(enemy);
            scene.add(enemy);
            lastSpawnTime = currentTime;
        }

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.position.z += enemy.speed;
            
            // Rotate asteroids
            if (enemy.rotationSpeed) {
                enemy.rotation.x += enemy.rotationSpeed;
                enemy.rotation.y += enemy.rotationSpeed;
                enemy.rotation.z += enemy.rotationSpeed;
            }

            // Check collision with player
            if (checkCollision(player, enemy)) {
                health -= 20;
                updateHealth();
                scene.remove(enemy);
                enemies.splice(i, 1);
                if (health <= 0) {
                    gameOver = true;
                }
                continue; // Skip the rest of this iteration
            }

            // Remove enemies that are too far past the player (much further than before)
            if (enemy.position.z > 20) { // Changed from 10 to 20 to give more time for shooting
                scene.remove(enemy);
                enemies.splice(i, 1);
                // Removed health penalty for passing enemies
            }
        }

        // Shooting
        if (keys[' ']) {
            const currentTime = Date.now();
            if (currentTime - lastShotTime > shootCooldown) {
                // Create main bullet
                const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
                bullet.position.copy(player.position);
                bullet.position.z += 1;
                
                // Add trail effect
                const trail = createBulletTrail();
                trail.position.z = -0.5;
                trail.rotation.x = Math.PI / 2;
                bullet.add(trail);
                
                // Add thrust particles
                const thrustParticles = [];
                for (let i = 0; i < thrustParticleCount; i++) {
                    const particle = new THREE.Mesh(thrustParticleGeometry, thrustParticleMaterial);
                    particle.position.z = -0.5;
                    particle.userData.velocity = new THREE.Vector3(0, 0, 0.1 + Math.random() * 0.1);
                    particle.userData.life = 1.0;
                    particle.userData.decay = 0.05 + Math.random() * 0.05;
                    thrustParticles.push(particle);
                    bullet.add(particle);
                }
                
                // Add properties for animation
                bullet.userData.trail = trail;
                bullet.userData.thrustParticles = thrustParticles;
                bullet.userData.initialTime = currentTime;
                
                bullets.push(bullet);
                scene.add(bullet);
                lastShotTime = currentTime;
            }
        }

        // Update bullets with trail effect
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.position.z -= 0.3;
            
            // Update trail effect
            if (bullet.userData.trail) {
                const timeSinceCreation = Date.now() - bullet.userData.initialTime;
                const trailOpacity = Math.max(0, 1 - timeSinceCreation / 500);
                bullet.userData.trail.material.opacity = trailOpacity * 0.6;
            }
            
            // Update thrust particles
            if (bullet.userData.thrustParticles) {
                bullet.userData.thrustParticles.forEach(particle => {
                    particle.position.z += particle.userData.velocity.z;
                    particle.userData.life -= particle.userData.decay;
                    particle.material.opacity = particle.userData.life;
                    
                    if (particle.userData.life <= 0) {
                        bullet.remove(particle);
                    }
                });
            }

            // Check collision with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (checkCollision(bullet, enemy)) {
                    // Create enhanced explosion effect
                    const explosionGeometry = new THREE.SphereGeometry(1.5, 16, 16);
                    const explosionMaterial = new THREE.MeshPhongMaterial({
                        color: 0xff6600,
                        emissive: 0xff3300,
                        emissiveIntensity: 2,
                        transparent: true,
                        opacity: 1
                    });
                    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
                    explosion.position.copy(bullet.position);
                    explosion.userData.startTime = Date.now();
                    explosion.userData.scaleSpeed = 0.1;
                    scene.add(explosion);
                    
                    // Create debris particles
                    const debrisParticles = createExplosionParticles(bullet.position, 0xcccccc);
                    
                    // Remove the enemy with a scale animation
                    enemy.userData.destroying = true;
                    enemy.userData.destroyStartTime = Date.now();
                    
                    scene.remove(bullet);
                    bullets.splice(i, 1);
                    score += 10;
                    updateScore();
                    break;
                }
            }

            // Remove bullets that are off screen
            if (bullet.position.z < -20) {
                scene.remove(bullet);
                bullets.splice(i, 1);
            }
        }

        // Update explosions and destroying enemies
        scene.traverse((object) => {
            if (object.userData.startTime) {
                const elapsed = Date.now() - object.userData.startTime;
                const scale = 1 + elapsed * object.userData.scaleSpeed;
                const opacity = Math.max(0, 1 - elapsed / 500);
                
                object.scale.set(scale, scale, scale);
                object.material.opacity = opacity;
                
                if (opacity <= 0) {
                    scene.remove(object);
                }
            }
            
            if (object.userData.destroying) {
                const elapsed = Date.now() - object.userData.destroyStartTime;
                const scale = Math.max(0, 1 - elapsed / 300);
                object.scale.set(scale, scale, scale);
                
                if (scale <= 0) {
                    scene.remove(object);
                    const index = enemies.indexOf(object);
                    if (index > -1) {
                        enemies.splice(index, 1);
                    }
                }
            }
            
            if (object.userData.velocity) {
                object.position.add(object.userData.velocity);
                object.userData.life -= object.userData.decay;
                object.material.opacity = object.userData.life;
                
                if (object.userData.life <= 0) {
                    scene.remove(object);
                }
            }
        });
    }

    renderer.render(scene, camera);
}

// Collision detection
function checkCollision(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function updateHealth() {
    document.getElementById('health').textContent = `Health: ${health}`;
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loading message
document.getElementById('loading').style.display = 'none';

// Create target pointer
function createTargetPointer() {
    // Create outer ring
    const outerRingGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
    const outerRingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.x = Math.PI / 2;

    // Create inner ring
    const innerRingGeometry = new THREE.RingGeometry(0.4, 0.6, 32);
    const innerRingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = Math.PI / 2;

    // Create crosshair
    const crosshairGeometry = new THREE.BufferGeometry();
    const crosshairVertices = new Float32Array([
        -0.8, 0, 0,  // Horizontal line
        0.8, 0, 0,
        0, 0, -0.8,  // Vertical line
        0, 0, 0.8
    ]);
    crosshairGeometry.setAttribute('position', new THREE.BufferAttribute(crosshairVertices, 3));
    const crosshairMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    const crosshair = new THREE.LineSegments(crosshairGeometry, crosshairMaterial);
    crosshair.rotation.x = Math.PI / 2;

    // Create projection indicator
    const projectionGeometry = new THREE.RingGeometry(0.2, 0.3, 16);
    const projectionMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
    });
    const projection = new THREE.Mesh(projectionGeometry, projectionMaterial);
    projection.rotation.x = Math.PI / 2;
    projection.userData.isProjection = true;

    // Group all elements
    const pointer = new THREE.Group();
    pointer.add(outerRing);
    pointer.add(innerRing);
    pointer.add(crosshair);
    pointer.add(projection);
    scene.add(pointer);
    return pointer;
}

// Initialize everything and start the game
function initGame() {
    // Create player ship
    player = createSpaceship(); // Assign to global player variable
    player.position.z = 5;
    scene.add(player);

    // Initialize target pointer
    targetPointer = createTargetPointer();
    targetPointer.position.z = -10;
    targetPointer.rotation.x = Math.PI / 2;

    // Camera position
    camera.position.z = 10;
    camera.position.y = 2;
    camera.lookAt(0, 0, 5);

    // Hide loading message
    document.getElementById('loading').style.display = 'none';

    // Start the game loop
    animate();
}

// Start the game after everything is initialized
initGame(); 