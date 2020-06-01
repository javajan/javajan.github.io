

var playerInBossRoom = false;

function PlayerUpdate() {
    var delta = engine.getDeltaTime();

    var forward = player.getDirection(new BABYLON.Vector3(0, 0, 1));
    var right = player.getDirection(new BABYLON.Vector3(1, 0, 0));

    var oldPlayerInBossRoom = playerInBossRoom;
    playerInBossRoom = PlayerInBossRoom();
    
    if (!oldPlayerInBossRoom && playerInBossRoom) {
        // entered boss room
        player.position.z += TILE_SIZE / 2; // dont get stuck in door hitbox
        map.bossRoomDoor.data.close(player);
        map.bossRoomDoor.data.isOpenAllowed = false;
        
        // spawn boss
        var bossTextureKeys = Object.keys(bossTextures);
        var bossTexture = bossTextures[bossTextureKeys[level % bossTextureKeys.length]];
        boss = CreateCustomEnemy(Math.floor(BOSS_ROOM_WIDTH/2), MAP_HEIGHT + Math.floor(BOSS_ROOM_HEIGHT/2), CreateBossInfo(0), bossTexture);
        enemies.push(boss);
    }
    
    
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
        player.data.sprint += Math.min (player.data.sprintMax, player.data.sprintRegen * delta);
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
        
        playerSpeed = playerSpeed / 2;
    }
    else {
        if (mouse[2] && mouse[0]) {
            // shoot
            if (!player.data.attackOnCooldown) {
                Attack(forward);
            }
            
            playerSpeed = playerSpeed / 2;
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
    
    // ############ interaction ################
    if (keyboardReleased["e"]) {
        var pp = player.position.add(forward);
        var ray = new BABYLON.Ray(pp, forward, player.data.interactionRange);
        var hit = scene.pickWithRay(ray, RaycastNotPlayer);
        
        //let rayHelper = new BABYLON.RayHelper(ray);
        //rayHelper.show(scene);
        
        if (hit.pickedMesh) {
            var mesh = hit.pickedMesh;
            if (mesh.hasOwnProperty("data") && mesh.data.hasOwnProperty("interactable")) {
                mesh.data.interact(player);
            }
            
            var parent = mesh.parent;
            if (parent && parent.hasOwnProperty("data") && parent.data.hasOwnProperty("interactable")) {
                parent.data.interact(player);
            }
        }
    }
    
}

function Attack(direction) {
    if (!player.data.attackOnCooldown) {
        // make sure we dont shoot ourselves
        var pp = player.position.add(direction);

        var ray = new BABYLON.Ray(pp, direction, player.data.attackRange);
        var hit = scene.pickWithRay(ray, RaycastNotPlayerAndNotOpenDoor);
        
        //let rayHelper = new BABYLON.RayHelper(ray);
	    //rayHelper.show(scene);
	    
        if (hit.pickedMesh) {
            enemies.forEach(enemy => {
                if (enemy == hit.pickedMesh) {
                    // damage enemy
                    enemy.data.takeDamage(enemy, player.data.damage);
                }
            });
        }
        
        player.data.attackOnCooldown = true;
    }
}

function PlayerInBossRoom() {
    var x = Math.floor(((player.position.x + TILE_SIZE/2) / TILE_SIZE));
    var y = Math.floor(((player.position.z + TILE_SIZE/2) / TILE_SIZE));
    
    if (x >= 0 && x < BOSS_ROOM_WIDTH && y >= MAP_HEIGHT && y < MAP_HEIGHT + BOSS_ROOM_HEIGHT) {
        return true;
    }
    return false;
}

function RaycastNotPlayer(mesh) {
    if (mesh == player) {
        return false;
    }
    return true;
}

function RaycastNotPlayerAndNotOpenDoor(mesh) {
    if  (mesh == player || 
        (mesh.hasOwnProperty("data") && mesh.data.hasOwnProperty("isDoor") && mesh.data.isOpen) || 
        (mesh.parent && mesh.parent.hasOwnProperty("data") && mesh.parent.data.hasOwnProperty("isDoor") && mesh.parent.data.isOpen)) {
        return false;
    }
    return true;
}
