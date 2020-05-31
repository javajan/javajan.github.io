
var enemies = [];
var enemySpeed = 0.05;

let ENEMY_WIDTH = 12, ENEMY_HEIGHT = 12;

// number of tiles
var enemyViewDistance = 5;

function CreateEnemy(enemyBase, x, y) {
    var enemy = enemyBase.createInstance("enemy");
    
    enemy.position.x = x * TILE_SIZE;
    enemy.position.y = ENEMY_HEIGHT / 2;
    enemy.position.z = y * TILE_SIZE;
    enemy.data = {
        timeToAttack: 500,
        attackTimer: 500,
        attackRange: 5,
        damage: 5,
        health: 100,
        lastDamageTaken: Infinity,
    };
    
    return enemy;
}

function DestroyEnemy(enemy) {
    enemy.dispose();
}   

function CreateEnemyBase(texture) {
    var mesh = BABYLON.MeshBuilder.CreatePlane("monster", {height: ENEMY_HEIGHT, width: ENEMY_WIDTH}, scene);
    
    var mat = new BABYLON.StandardMaterial("monster_material", scene);
    mat.diffuseTexture = texture;
    mat.ambientColor = new BABYLON.Color3(.8,.8,.8);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    mesh.material = mat;
    mesh.isVisible = false;
    
    return mesh;
}

function FollowPlayer(enemy) {
    var delta = engine.getDeltaTime();

    var distance = player.position.subtract(enemy.position).length();
        
    if (distance > 2) {
        var direction = player.position.subtract(enemy.position).normalize();
        enemy.moveWithCollisions(direction.scale(enemySpeed * delta));
    }
    if (distance < enemy.data.attackRange) {
        enemy.data.attackTimer -= delta;
        
        if (enemy.data.attackTimer <= 0) {
            // ATTACK
            player.data.health -= enemy.data.damage;
            enemy.data.attackTimer = enemy.data.timeToAttack;
        }
    }
    else {
        // reset attack timer
        enemy.data.attackTimer = enemy.data.timeToAttack;
    }
    
    // destroy potential debug lines and path
    if (enemy.data.currentPath != null && enemy.data.currentPath.length > 0) {
        if (enemy.data.debugPath) {
            enemy.data.debugPath.dispose();
        }
        enemy.data.currentPath = [];
    }
}

function CanSeePlayer(enemy) {
    var distance = enemy.position.subtract(player.position).length();
    if (distance > enemyViewDistance * TILE_SIZE)
        return false;

    var direction = enemy.position.subtract(player.position).normalize();
    var pp = player.position.add(direction);

    // TODO use multipick and check if door is in front of player, otherwise enemy cant see through doors

    // turns out this is really slow, don't use often :)
    var ray = new BABYLON.Ray(pp, direction, enemyViewDistance * TILE_SIZE);
    var hit = scene.pickWithRay(ray);
    
    //let rayHelper = new BABYLON.RayHelper(ray);
	//rayHelper.show(scene);
    
    if (hit.pickedMesh && hit.pickedMesh == enemy) {
        return true;
    }
    return false;
}

function MoveAlongPath(enemy, path) {
    if (path == null || path.length == 0)
        return; // we done
        
    var delta = engine.getDeltaTime() / 1000;
    
    var nextTile = path[0];
    var moveTo = new BABYLON.Vector3(nextTile.x * TILE_SIZE, enemy.position.y, nextTile.y * TILE_SIZE);
    var distance = moveTo.subtract(enemy.position).length();
    
    if (distance < 0.1) {
        path.shift();
    }
    
    var direction = moveTo.subtract(enemy.position);
    
    enemy.position = enemy.position.add(direction.scale(enemySpeed * 100 * delta));
    //enemy.moveWithCollisions(direction.scale(0.2));
}

function PathCompleted(enemy, path) {
    if (path == null || path.length == 0)
        return true;
    return false;
}

function FindPath(enemy, x, y) {
    // https://www.raywenderlich.com/3016-introduction-to-a-pathfinding

    var ex = Math.floor(((enemy.position.x + TILE_SIZE/2) / TILE_SIZE));
    var ey = Math.floor(((enemy.position.z + TILE_SIZE/2) / TILE_SIZE));
    
    var directions = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    var directionCoords = [{x: 0, y: 1}, {x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}];
    
    var open = [];
    var closed = [];
    
    var beginTile = {
        x: ex, 
        y: ey, 
        parent: null, 
        g: 0, // how many steps until this tile
        h: Math.abs(x-ex)+Math.abs(y-ey) // estimated number of steps to goal from this tile
    };
    open.push(beginTile);

    var found = null;
    while (open.length > 0 && found == null) {
        // pick closest to target
        var closestTile = null;
        var distance = Infinity;
        var index = -1;
        for (var i=0; i<open.length; i++) {
            var t = open[i];
        
            if (t.g + t.h < distance) {
                closestTile = t;
                index = i;
                distance = t.g + t.h;
            }
        }
        open.splice(index, 1);
        
        var currentTile = closestTile;
        closed.push(currentTile);
        
        directions.forEach(direction => {
            if (CanWalk(currentTile.x, currentTile.y, direction))
            {
                var coord = DirectionToCoords(direction);
                var ntx = currentTile.x + coord.x;
                var nty = currentTile.y + coord.y;
                
                var nextTile = {
                    x: ntx,
                    y: nty,
                    parent: currentTile,
                    g: currentTile.g+1,
                    h: Math.abs(x-ntx)+Math.abs(y-nty)
                };
                
                if (ntx == x && nty == y) {
                    found = nextTile;
                }
                else {
                    if (CoordListGet(closed, nextTile) == null)
                    {
                        // not in closed list
                        var exists = CoordListGet(open, nextTile);
                        if (exists != null) {
                            // already in open list
                            if (exists.g > nextTile.g) {
                                exists.parent = currentTile;
                                exists.g = nextTile.g;
                            }
                        }
                        else {
                            // not in open list (new tile)
                            var c = DirectionToCoords(direction);
                            open.push(nextTile);
                        }
                    }
                }
            }
        });
    }
    
    var path = null;
    
    if (found) {
        path = [];
    
        var tile = found;
        while(tile != null) {
            path.unshift(tile);
            tile = tile.parent;
        }
    }
    
    return path;
}

function DrawDebugPath(enemy, path) {
    if (path == null)
        return;

    if (enemy.data.debugPath) {
        enemy.data.debugPath.dispose();
    }

    var points = [];
    
    for (var i=0; i<path.length; i++) {
        var tile = path[i];
        points.push(new BABYLON.Vector3(tile.x * TILE_SIZE, 0, tile.y * TILE_SIZE));
    }

    
    var lines = BABYLON.MeshBuilder.CreateLines("lines", {points: points}, scene);
    enemy.data.debugPath = lines;
}

function CoordListGet(list, coord) {
    var t = null;
    list.forEach(c => {
        if (c.x == coord.x && c.y == coord.y) {
            t = c;
        }
    });
    return t;
}
