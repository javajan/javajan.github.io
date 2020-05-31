
var camera;

var keyboard = [];
var mouse = [];

var isLocked = false;

var projectiles;
var projectileSpeed = 100;

var mapView = false;

var player;
let mouseSens = 10000;
var flashlight = null;

let PLAYER_HEIGHT = 4;

var healthText, sprintText;
var gunImage;

var enemyTypeCOOMER;

var time = 0;

function init(scene) {

    console.log("penis")

    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    
    scene.gravity = new BABYLON.Vector3(0, -1, 0);
    scene.collisionsEnabled = true;
    
    player = BABYLON.MeshBuilder.CreateBox("Player", {height: PLAYER_HEIGHT, width: 1, depth: 1}, scene);
    player.position.y = 7.5;
    player.checkCollisions = true;
    
    // camera setup
    if (mapView) {
        camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, 
                                             new BABYLON.Vector3(MAP_WIDTH * TILE_SIZE / 2, 0, 
                                             MAP_HEIGHT*TILE_SIZE/2), scene );
        camera.setPosition(new BABYLON.Vector3(0, 200, 0));
        
        scene.ambientColor = new BABYLON.Color3(1, 1, 1);
        
        flashlight = new BABYLON.SpotLight(  "spotLight", 
                                        new BABYLON.Vector3(0, 5, 0), 
                                        new BABYLON.Vector3(0, 0, 1), 
                                        Math.PI / 2, 20, scene );
        flashlight.intensity = 10;
    }
    else {
        camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 0, 0), scene);
        camera.inputs.clear();
        
        camera.minZ = 0.01;
        camera.fov = Math.PI / 2;
        camera.angularSensibility = 500;
        camera.inertia = 0.5;
        camera.parent = player;
       
        // setup lighting
        scene.ambientColor = new BABYLON.Color3(.4, .4, .4);
        flashlight = new BABYLON.SpotLight(  "flashlight", 
                                        new BABYLON.Vector3(0, 5, 0), 
                                        new BABYLON.Vector3(0, 0, 1), 
                                        Math.PI / 2, 20, scene );
        flashlight.intensity = 1;
    }
    camera.attachControl(canvas, true);
    
    // register keyboard input
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                keyboard[kbInfo.event.key] = true;
                if (kbInfo.event.key == "r") {
                    Restart();
                }   
                
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                keyboard[kbInfo.event.key] = false;
                break;
        }
    });
    
    scene.onPointerDown = function (evt) {
		if (!isLocked) {
			canvas.requestPointerLock =    canvas.requestPointerLock 
                                        || canvas.msRequestPointerLock 
                                        || canvas.mozRequestPointerLock 
                                        || canvas.webkitRequestPointerLock;
			if (canvas.requestPointerLock) {
				canvas.requestPointerLock();
			}
		}
	};
	
	scene.onPointerObservable.add((pointerInfo) => {
	
        if (pointerInfo.event.buttons & 2) {
            mouse[2] = true;
        } else if ((pointerInfo.event.buttons & 2) === 0) {
            mouse[2] = false;
        }

        if (pointerInfo.event.buttons & 1) {
            mouse[0] = true;
        } else if ((pointerInfo.event.buttons & 1) === 0) {
            mouse[0] = false;
        }
	    
	    if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERMOVE) {
	        var mouseX = pointerInfo.event.movementX;
            var mouseY = pointerInfo.event.movementY;
            player.rotate(BABYLON.Axis.Y, mouseX * engine.getDeltaTime() / mouseSens, BABYLON.Space.WORLD);
	    }
	    
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERWHEEL:
                break;
            case BABYLON.PointerEventTypes.POINTERPICK:
                break;
            case BABYLON.PointerEventTypes.POINTERTAP:
                break;
            case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                break;
        }
    });
    
    // fixes camera bug in firefox
    scene.preventDefaultOnPointerUp = false;
    scene.preventDefaultOnPointerDown = false;
    
    enemyTypeCOOMER = CreateEnemyBase(monsterTextures.moon2COOM);
    
    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    healthText = new BABYLON.GUI.TextBlock();
    healthText.color = "white";
    healthText.fontSize = 24;
    healthText.width = 0.05;
    healthText.height = 0.05;
    healthText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    healthText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    healthText.fontFamily = "Silkscreen";
    
    sprintText = new BABYLON.GUI.TextBlock();
    sprintText.color = "white";
    sprintText.fontSize = 24;
    sprintText.width = 0.1;
    sprintText.height = 0.05;
    sprintText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    sprintText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    sprintText.fontFamily = "Silkscreen";
    
    gunImage = new BABYLON.GUI.Image("gun", "res/gun.png");
    gunImage.height = "512px";
    gunImage.width = "512px";
    
    gunImage.cellId = 0;
    gunImage.cellWidth = 512;
    gunImage.cellHeight = 512;
    
    gunImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gunImage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    gunImage.top = 50;
    
    advancedTexture.addControl(gunImage);
    advancedTexture.addControl(healthText);
    advancedTexture.addControl(sprintText);
    
    InitMap();
    Restart();
}

function Restart() {
    time = 0;

    // despawn enemies
    if (enemies)
        enemies.forEach(e => {e.dispose()});
    enemies = [];
    for (var i=0; i<5; i++) {
        var x = 10 + Math.floor(Math.random() * MAP_WIDTH - 10);
        var y = 10 + Math.floor(Math.random() * MAP_HEIGHT - 10);
        
        enemies.push(CreateEnemy(enemyTypeCOOMER, x, y));
    }
    
    if (projectiles)
        projectiles.forEach(p => {p.dispose()});
    projectiles = [];

    player.position = new BABYLON.Vector3(0, TILE_SIZE / 2, 0);
    camera.angle = Math.PI/2;
    player.data = {
        health: 100,
        sprintMax: 100,
        sprint: 100,
        sprintCost: 5,
        sprintRegen: 0.1,
        
        attackOnCooldown: false,
        attackCooldown: 200,
        attackTimer: 0,
        attackRange: 100,
        damage: 10,
        
        speed: 0.1,
    };
    
    GenerateMap();
}

function Update() {
    var forward = player.getDirection(new BABYLON.Vector3(0, 0, 1));
    var right = player.getDirection(new BABYLON.Vector3(1, 0, 0));
    
    var delta = engine.getDeltaTime();
    time += delta;
    
    // update GUI
    healthText.text = player.data.health + " HP";
    sprintText.text = Math.floor(player.data.sprint / player.data.sprintMax * 100) + " STAMINA";
    
    // TODO delta time seems scuffed
    var delta = engine.getDeltaTime();
    
    // #################  movement #################
    
    var playerMovement = new BABYLON.Vector3(0, 0, 0);
    var playerSpeed = player.data.speed;
    
    if (keyboard["Shift"]) {
        if (player.data.sprint > player.data.sprintCost) {
            playerSpeed = 2 * playerSpeed;
            player.data.sprint -= player.data.sprintCost;
        }
    }
    
    if (keyboard["w"]) {
        playerMovement.x = forward.x;
        playerMovement.z = forward.z;
    }
    else if (keyboard["s"]) {
        playerMovement.x = -forward.x;
        playerMovement.z = -forward.z;
    }
    if (keyboard["d"]) {
        playerMovement.x = right.x;
        playerMovement.z = right.z;
    }
    else if (keyboard["a"]) {
        playerMovement.x = -right.x;
        playerMovement.z = -right.z;
    }
    
    // TODO remove debug
    if (keyboard[" "]) {
        playerMovement.y = 0.1;
    }
    else if (keyboard["Ctrl"]) {
        playerMovement.y = -0.1;
    }
    
    // #################   sprint   #################
    if (player.data.sprint < player.data.sprintMax) {
        player.data.sprint += player.data.sprintRegen * delta;
    }
    
    // #################  attacking  #################
    
    
    if (player.data.attackOnCooldown) {
        // dispay shoot anim
        if (player.data.attackTimer < player.data.attackCooldown / 10) {
            gunImage.cellId = 1;
            flashlight.intensity = 10;
        }
        else {
            flashlight.intensity = 1;
            gunImage.cellId = 2;
        }
    
        // reset cooldown
        player.data.attackTimer += delta;
        if (player.data.attackTimer > player.data.attackCooldown) {
            player.data.attackOnCooldown = false;
            player.data.attackTimer = 0;
        }
    }
    else {
        if (mouse[2] && mouse[0]) {
            // shoot
            if (!player.data.attackOnCooldown) {
                Attack(forward);
            }
        }
        else if (mouse[2]) {
            // aim
            gunImage.cellId = 0;
            gunImage.top = 0;
            
            playerSpeed = playerSpeed / 2;
        }
        else {
            // idle
            gunImage.cellId = 0;
            gunImage.top = 50;
        }
    }
    
    player.moveWithCollisions(playerMovement.scale(playerSpeed * delta));
    
    // move flashlight
    if (flashlight != null) {
        flashlight.position.copyFrom(player.position);
        flashlight.direction = player.forward;
    }
    
    // ################# enemies #################
    for (var i=0; i<enemies.length; i++) {
        var enemy = enemies[i];
        
        // remove dead enemies
        if (enemy.data.health <= 0) {
            DestroyEnemy(enemy);
            enemies.splice(i, 1);
        }
        else {
            if (CanSeePlayer(enemy)) {
                enemy.material.diffuseColor  = new BABYLON.Color3(.3,0,0);
                enemy.material.emissiveColor = new BABYLON.Color3(.3,0,0);
                
                FollowPlayer(enemy);
            }
            else {
                enemy.material.diffuseColor  = new BABYLON.Color3(0,0,0);
                enemy.material.emissiveColor = new BABYLON.Color3(0,0,0);
                
                
                // move to random point on map
                if (!PathCompleted(enemy, enemy.data.currentPath)) {
                    MoveAlongPath(enemy, enemy.data.currentPath);
                }
                else {
                    // path done, find new path
                    var x = Math.floor(Math.random() * MAP_WIDTH);
                    var y = Math.floor(Math.random() * MAP_HEIGHT);
                    
                    enemy.data.currentPath = FindPath(enemy, x, y);
                    //DrawDebugPath(enemy, enemy.data.currentPath);
                }
            }
            
            // rotate towards player
            enemy.rotationQuaternion = RotateTowardsMe(player.position, enemy.position);
        }
    }
    
    // ################# projectiles #################
    for (var i=0; i<projectiles.length; i++) {
        var p = projectiles[i];
        
        // rotate towards player
        var d = p.position.subtract(player.position);
        d.normalize();
        var rotation = Math.atan2(d.z, d.x) - Math.PI / 2;
        var axis = new BABYLON.Vector3(0, 1, 0);
        var quaternion = new BABYLON.Quaternion.RotationAxis(axis, -rotation);
        p.rotationQuaternion = quaternion;

        // move
        p.position.copyFrom(p.position.add(p.data.direction.scale(delta / 1000)));
        
        p.data.destroyTimer -= delta;
        if (p.data.destroyTimer < 0) {
            p.dispose();
            projectiles.splice(i, 1);
        }
    }
    
    if (player.data.health <= 0 && !mapView) {
        // game over
        Restart();
    }
}

function RotateTowardsMe(mypos, pos) {
    var d = pos.subtract(mypos);
    d.normalize();
    
    var rotation = Math.atan2(d.z, d.x) - Math.PI / 2;
    var axis = new BABYLON.Vector3(0, 1, 0);
    var quaternion = new BABYLON.Quaternion.RotationAxis(axis, -rotation);
    return quaternion;
}

function Attack(direction) {
    if (!player.data.attackOnCooldown) {
        // make sure we dont shoot ourselves
        var pp = player.position.add(direction);

        var ray = new BABYLON.Ray(pp, direction, player.data.attackRange);
        var hit = scene.pickWithRay(ray);
        
        //let rayHelper = new BABYLON.RayHelper(ray);
	    //rayHelper.show(scene);
	    
        if (hit.pickedMesh) {
            enemies.forEach(enemy => {
                if (enemy == hit.pickedMesh) {
                    // damage enemy
                    enemy.data.health -= player.data.damage;
                }
            });
        }
        
        player.data.attackOnCooldown = true;
    }
}

function SpawnProjectile() {
    // TODO instanced rendering for HUGE FPS

    var projectile = BABYLON.MeshBuilder.CreatePlane("projectile", {height: 2, width: 2}, scene);
    var mat = new BABYLON.StandardMaterial("projectile_mat", scene);
    
    mat.diffuseTexture = effectTextures.cloud_cold_2;
    mat.ambientColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    var camDirection = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
    
    projectile.material = mat;
    projectile.position.copyFrom(camera.position.add(camDirection.scale(5)));
    
    projectile.data = {
        direction: camDirection.scale(projectileSpeed),
        destroyTimer: 5000
    };
    projectiles.push(projectile);
}

