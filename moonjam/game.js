
var camera;

var keyboard = [];
var keyboardReleased = [];

var mouse = [];

var isLocked = false;

var projectiles;
var projectileSpeed = 100;

var items;

var mapView = false;

var player;
let mouseSens = 10000;
var flashlight = null;

let PLAYER_HEIGHT = 20;
let INVENTORY_CAPACITY = 3;

var infoMessages = [];

var firstGameLoop = true;

var boss = null;

var time = 0;

var level = 0;

var lastPlayerPosition = null;

let GameState = {
    Playing: 0,
    LostLevel: 1,
    WonLevel: 2,
}   
var currentGameState = GameState.Playing;
var currentGameStateTimer = 0;

function init(scene) {

    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    
    scene.gravity = new BABYLON.Vector3(0, -1, 0);
    scene.collisionsEnabled = true;
    
    player = BABYLON.MeshBuilder.CreateBox("Player", {height: PLAYER_HEIGHT, width: 3, depth: 3}, scene);
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
                    LoadLevel(level);
                }   
                
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                keyboard[kbInfo.event.key] = false;
                keyboardReleased[kbInfo.event.key] = true;
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
	        if (currentGameState != GameState.LostLevel) {
	            var mouseX = pointerInfo.event.movementX;
                var mouseY = pointerInfo.event.movementY;
                player.rotate(BABYLON.Axis.Y, mouseX * engine.getDeltaTime() / mouseSens, BABYLON.Space.WORLD);
	        }
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
    
    // GUI
    GUIInit(scene);
    
    lastPlayerPosition = player.position;
    
    InitMap();
    LoadLevel(level);
}

function LoadLevel(levelIndex) {
    if (!mapView) {
        scene.ambientColor = new BABYLON.Color3(.1, .1, .1);
    }

    level = levelIndex;
    time = 0;
    
    currentGameStateTimer = 0;
    currentGameState =  GameState.Playing;
    
    // ################## despawn boss  ##################
    if (boss != null) {
        boss.dispose();
        boss = null;
        bossHealthText.isVisible = false;
    }
    
    // ################## (de)spawn items ##################
    if (items)
        items.forEach(i => {i.dispose()});
    items = [];
    //items.push(CreateItem(BOSS_KEY_ID, itemTextures.key, 0, MAP_HEIGHT-1, "res/DungeonCrawlStone/item/misc/key.png"));
    items.push(CreateItem(BOSS_KEY_ID, itemTextures.key, Math.floor(Math.random() * MAP_WIDTH), Math.floor(Math.random() * MAP_HEIGHT), "res/DungeonCrawlStone/item/misc/key.png"));
    
    // ################## (de)spawn enemies ##################
    if (enemies)
        enemies.forEach(e => {e.dispose()});
    enemies = [];
    
    var monsterTextureKeys = Object.keys(monsterTextures);
    for (var i=0; i<10; i++) {
        var x = Math.floor(Math.random() * MAP_WIDTH);
        var y = Math.floor(Math.random() * MAP_HEIGHT);
        
        var randomTexture = monsterTextures[monsterTextureKeys[Math.floor(Math.random()*monsterTextureKeys.length)]];
        enemies.push(CreateBasicEnemy(x, y, DefaultEnemyUpdate, randomTexture));
    }
    
    var bossTextureKeys = Object.keys(bossTextures);
    var bossTexture = bossTextures[bossTextureKeys[level % bossTextureKeys.length]];
    enemies.push(CreatePatrolEnemy(MAP_WIDTH-1, MAP_HEIGHT-1, bossTexture));
    
    // ################## despawn projectiles ##################
    if (projectiles)
        projectiles.forEach(p => {p.dispose()});
    projectiles = [];

    //player.position = new BABYLON.Vector3(0, TILE_SIZE / 2, (MAP_HEIGHT-1)*TILE_SIZE); // boss room
    player.position = new BABYLON.Vector3(0, PLAYER_HEIGHT / 2, 0); // level start
    camera.angle = Math.PI/2;
    player.data = {
        health: 100,
        sprintMax: 100,
        sprint: 100,
        sprintCost: 1,
        sprintRegen: 0.009,
        
        attackOnCooldown: false,
        attackCooldown: 200,
        attackTimer: 0,
        attackRange: 100,
        damage: 10,
        
        speed: 0.05,
        interactionRange: 15,
        
        inventory: {
            items: [],
        },
        
        takeDamage: function(d) {
            player.data.health -= d;
        },
    };
    
    
    infoMessages = [];
    infoMessages.push({
        message: "Level " + (level+1),
        timeLeft: 4000,
    });
    
    
    GenerateMap();
    firstGameLoop = true;
}

function Update() {
    var delta = engine.getDeltaTime();
    time += delta;
    
    // ################# GAME STATE ##################
    
    if (currentGameState == GameState.Playing) {
        // #################  GUI  #################
        healthText.text = player.data.health + " HP";
        sprintText.text = Math.floor(player.data.sprint / player.data.sprintMax * 100) + " STAMINA";
        
        for (var i=0; i<INVENTORY_CAPACITY; i++) {
            var item = player.data.inventory.items[i];
            if (item) {
                if (item.res !== inventoryImages[i].source) {
                    inventoryImages[i].source = item.res;
                }
                inventoryImages[i].isVisible = true;
            }
            else {
                inventoryImages[i].isVisible = false;
            }
        }
        
        infoText.text = "";
        for (var i=0; i<infoMessages.length; i++) {
            var infoMessage = infoMessages[i];
            
            infoText.text = infoText.text + "\n" + infoMessage.message;
            
            infoMessage.timeLeft -= delta;
            if (infoMessage.timeLeft <= 0) {
                infoMessages.splice(i, 1);
            }
        }
        
        // ################# player #################
        PlayerUpdate();
        
        // ################# items #################
        for (var i=0; i<items.length; i++) {
            var item = items[i];
            
            // collect if players walks over
            if (!firstGameLoop) { // for some reason collides with player at beginning of game?
                if (item.intersectsMesh(player, false)) {
                    if (player.data.inventory.items.length < INVENTORY_CAPACITY) {
                        item.dispose();
                        player.data.inventory.items.push(item.data);
                        items.splice(i, 1);
                    }
                }
            }   
            
            // rotate towards player
            item.rotationQuaternion = RotateTowardsMe(player.position, item.position);
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
                // nice
                enemy.data.update(enemy);
                
                // rotate towards player
                enemy.rotationQuaternion = RotateTowardsMe(player.position, enemy.position);
                
                // close opened doors
                for (var d=0; d<enemy.data.openedDoors.length; d++) {
                
                    var door = enemy.data.openedDoors[d];
                    var distance = door.position.subtract(enemy.position).length();
                
                    if (distance > TILE_SIZE) {
                        door.data.close(enemy);
                        enemy.data.openedDoors.splice(d, 1);
                    }
                }
                
                // white if taken damage
                if (time - enemy.data.timeLastDamage < 100) {
                    enemy.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                    enemy.material.specularColor = new BABYLON.Color3(.5, 0.2, .2);
                }
                else {
                    enemy.material.specularColor = new BABYLON.Color3(0, 0, 0);
                    enemy.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                }
            }
        }
        
        // ################# projectiles #################
        for (var i=0; i<projectiles.length; i++) {
            var p = projectiles[i];
            var destroy = false;
            
            // rotate towards player
            var d = p.position.subtract(player.position);
            d.normalize();
            var rotation = Math.atan2(d.z, d.x) - Math.PI / 2;
            var axis = new BABYLON.Vector3(0, 1, 0);
            var quaternion = new BABYLON.Quaternion.RotationAxis(axis, -rotation);
            p.rotationQuaternion = quaternion;

            // move
            p.position = p.position.add(p.data.direction.scale(p.data.speed * delta));
            
            p.data.destroyTimer -= delta;
            if (p.data.destroyTimer < 0) {
                destroy = true;
            }
            if (p.intersectsMesh(player, false)) {
                player.data.takeDamage(p.data.damage);
                destroy = true;
            }
            
            if (destroy) {
                p.dispose();
                projectiles.splice(i, 1);
            }
        }
        
        // ########### GAME STATE SWITCHES #############
        
        if (boss != null) {
            bossHealthText.isVisible = true;
            bossHealthText.text = "BOSS: " +  boss.data.health + "HP";
            
            if (boss.data.health <= 0) {
                currentGameStateTimer = 0;
                currentGameState = GameState.WonLevel;
            }
        }
        
        if (player.data.health <= 0 && !mapView) {
            // game over
            currentGameStateTimer = 0;
            currentGameState = GameState.LostLevel;
            
            // TODO JUMP SCARE SOUND
            // despawn other enemies
            if (enemies)
                enemies.forEach(e => {e.dispose()});
            
            scene.ambientColor = new BABYLON.Color3(.8, .8, .8);
            
            // spawn boss right in front of player
            var bossTextureKeys = Object.keys(bossTextures);
            var bossTexture = bossTextures[bossTextureKeys[level % bossTextureKeys.length]];
            
            var forward = player.getDirection(new BABYLON.Vector3(0, 0, 1));
            forward.y = 0;
            var pos = player.position.add(forward.scale(2));
            var enemy = CreateBasicEnemy(0, 0, DefaultEnemyUpdate, bossTexture);
            enemy.position.x = pos.x;
            enemy.position.y = PLAYER_HEIGHT/2;
            enemy.position.z = pos.z;
            enemy.rotationQuaternion = RotateTowardsMe(player.position, enemy.position);
            console.log(enemy.position)
            enemies.push(enemy);
        }
    }
    else if (currentGameState == GameState.LostLevel) {
        if (currentGameStateTimer >= 3000) {
            LoadLevel(level);
        }
    }
    else if (currentGameState == GameState.WonLevel) {
        if (level == Object.keys(bossTextures).length-1) {
            infoText.text = "You have defeated all bosses :)";
            infoText.text = infoText.text + "\n" +  "But you can keep playing if you want";
            
            if (currentGameStateTimer >= 4000) {
                LoadLevel(level+1);
            }
        }
        else {
            infoText.text = "You beat this level, nice :)";
            
            if (currentGameStateTimer >= 4000) {
                LoadLevel(level+1);
            }
        }
        // allow player to move
        PlayerUpdate();
    }
    
    currentGameStateTimer += delta;
    
    keyboardReleased = [];
    firstLoop = false;
    lastPlayerPosition = player.position;
}

function RotateTowardsMe(mypos, pos) {
    var d = pos.subtract(mypos);
    d.normalize();
    
    var rotation = Math.atan2(d.z, d.x) - Math.PI / 2;
    var axis = new BABYLON.Vector3(0, 1, 0);
    var quaternion = new BABYLON.Quaternion.RotationAxis(axis, -rotation);
    return quaternion;
}

function SpawnProjectile(pos, info) {
    // TODO instanced rendering for HUGE FPS

    var projectile = BABYLON.MeshBuilder.CreatePlane("projectile", {height: 2, width: 2}, scene);
    var mat = new BABYLON.StandardMaterial("projectile_mat", scene);
    
    mat.diffuseTexture = effectTextures.cloud_cold_2;
    mat.ambientColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    var camDirection = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
    
    projectile.material = mat;
    projectile.position.copyFrom(pos);
    
    projectile.data = info;
    
    projectiles.push(projectile);
}

