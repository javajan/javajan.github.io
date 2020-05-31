let MAP_WIDTH = 30, MAP_HEIGHT = 30;
let TILE_SIZE = 20;

let DOOR_PROBABILITY = 0.05;

var wallsEnabled = true;

const Direction = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3  
};

var map = null;

var roomStyles;
var currentRoomStyleIndex;

function InitMap() {
    // create ground hitbox
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE}, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.isVisible = false;
    ground.checkCollisions = true;
    ground.position = new BABYLON.Vector3((MAP_WIDTH - 1) * TILE_SIZE/2, 0, (MAP_HEIGHT - 1) * TILE_SIZE/2);

    // create room styles
    roomStyles = [];
    currentRoomStyleIndex = 0;
    
    var doorBase = CreateDoorBase(scene, "style3", tileTextures.open_door);
    
    console.log("test")
    
    var stoneStyle = {
        floors: [
            CreateFloorBase(scene, "stone", tileTextures.cobble_blood_8_old),
            CreateFloorBase(scene, "stone", tileTextures.cobble_blood_9_old),
            CreateFloorBase(scene, "stone", tileTextures.cobble_blood_10_old),
            CreateFloorBase(scene, "stone", tileTextures.cobble_blood_11_old),
            CreateFloorBase(scene, "stone", tileTextures.cobble_blood_4_old),
        ],
        walls: [
            CreateWallBase(scene, "stone2", tileTextures.catacombs_0),
            CreateWallBase(scene, "stone2", tileTextures.catacombs_1),
            CreateWallBase(scene, "stone2", tileTextures.catacombs_2),
            CreateWallBase(scene, "stone2", tileTextures.catacombs_3),
            CreateWallBase(scene, "stone2", tileTextures.catacombs_4),
        ],
        doors: [doorBase]
    };
    
    var etchedStyle = {
        floors: [
            CreateFloorBase(scene, "etched", tileTextures.etched_0),
            CreateFloorBase(scene, "etched", tileTextures.etched_1),
            CreateFloorBase(scene, "etched", tileTextures.etched_2),
            CreateFloorBase(scene, "etched", tileTextures.etched_3),
            CreateFloorBase(scene, "etched", tileTextures.etched_4),
        ],
        walls: [
            CreateWallBase(scene, "relief_brown", tileTextures.relief_brown_0),
            CreateWallBase(scene, "relief_brown", tileTextures.relief_brown_1),
            CreateWallBase(scene, "relief_brown", tileTextures.relief_brown_2),
            CreateWallBase(scene, "relief_brown", tileTextures.relief_brown_3),
        ],
        doors: [doorBase]
    };
    
    var fleshStyle = {
        floors: [
            CreateFloorBase(scene, "grey_dirt_b", tileTextures.grey_dirt_b_0),
            CreateFloorBase(scene, "grey_dirt_b", tileTextures.grey_dirt_b_1),
            CreateFloorBase(scene, "grey_dirt_b", tileTextures.grey_dirt_b_2),
            CreateFloorBase(scene, "grey_dirt_b", tileTextures.grey_dirt_b_3),
            CreateFloorBase(scene, "grey_dirt_b", tileTextures.grey_dirt_b_4),
        ],
        walls: [
            CreateWallBase(scene, "wall_flesh", tileTextures.wall_flesh_2),
            CreateWallBase(scene, "wall_flesh", tileTextures.wall_flesh_3),
            CreateWallBase(scene, "wall_flesh", tileTextures.wall_flesh_4),
            CreateWallBase(scene, "wall_flesh", tileTextures.wall_flesh_5),
            CreateWallBase(scene, "wall_flesh", tileTextures.wall_flesh_6),
        ],
        doors: [doorBase]
    };
    
    var stoneStyle2 = {
        floors: [
            CreateFloorBase(scene, "stone2", tileTextures.pebble_brown_2_old),
            CreateFloorBase(scene, "stone2", tileTextures.pebble_brown_3_old),
            CreateFloorBase(scene, "stone2", tileTextures.pebble_brown_4_old),
            CreateFloorBase(scene, "stone2", tileTextures.pebble_brown_5_old),
        ],
        walls: [
            CreateWallBase(scene, "stone", tileTextures.brick_dark_3),
            CreateWallBase(scene, "stone", tileTextures.brick_dark_4),
            CreateWallBase(scene, "stone", tileTextures.brick_dark_5),
            CreateWallBase(scene, "stone", tileTextures.brick_dark_6),
        ],
        doors: [doorBase]
    };
    
    var style3 = {
        floors: [
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_1),
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_2),
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_3),
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_4),
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_5),
            CreateFloorBase(scene, "style3", tileTextures.demonic_red_6),
        ],
        walls: [
            CreateWallBase(scene, "style3", tileTextures.hell_1),
            CreateWallBase(scene, "style3", tileTextures.hell_2),
            CreateWallBase(scene, "style3", tileTextures.hell_3),
            CreateWallBase(scene, "style3", tileTextures.hell_4),
            CreateWallBase(scene, "style3", tileTextures.hell_5),
            CreateWallBase(scene, "style3", tileTextures.hell_6),
            CreateWallBase(scene, "style3", tileTextures.hell_7),
            CreateWallBase(scene, "style3", tileTextures.hell_8),
            CreateWallBase(scene, "style3", tileTextures.hell_9),
        ],
        doors: [doorBase]
    };
    
    roomStyles.push(stoneStyle);
    roomStyles.push(stoneStyle2);
    roomStyles.push(style3);
    roomStyles.push(etchedStyle);
    roomStyles.push(fleshStyle);
}

function GenerateMap() {
    if (map != null) {
        map.tiles.forEach(row => {
            row.forEach(floor => {
                floor.data.edges.forEach(edge => {
                    if (edge && typeof edge.dispose === 'function')
                        edge.dispose();            
                });
                floor.dispose();
            });
        });
        
    }
    
    map = {rooms: [], tiles: []};
    for (var y=0; y<MAP_HEIGHT; y++) {
        map.tiles[y] = [];
    }

    // tree grow algorithm
    var backtrack = [];
    backtrack.push(CreateFloor(scene, Math.floor(Math.random() * MAP_WIDTH), Math.floor(Math.random() * MAP_HEIGHT), CreateRoom()));
    while(backtrack.length > 0)
    {
        var currentTile = backtrack.pop();
        var ox = currentTile.position.x / TILE_SIZE;
        var oy = currentTile.position.z / TILE_SIZE;
        
        if (!IsFloorComplete(currentTile)) {
            backtrack.push(currentTile);
            
            // walk in random direction that is not initialized
            var randomDirection = DirectionToCoords(RandomDirection(currentTile));
            
            var x = ox + randomDirection.x;
            var y = oy + randomDirection.y;
        
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                var nextTile = map.tiles[y][x];
                
                if (nextTile) {
                    // tile already exists
                    if (currentTile.data.room == nextTile.data.room) {
                        CreatePassage(scene, currentTile, nextTile);
                    }
                    else {
                        CreateWall(scene, ox, oy, x, y, scene);
                    }
                }
                else {
                    var door = Math.random() < DOOR_PROBABILITY;
                    var room = currentTile.data.room;
                    if (door) {
                        room = CreateRoom();
                    }

                    // Create new tile and connect it to current tile
                    var newTile = CreateFloor(scene, x, y, room);
                    
                    if (door) {
                        CreateDoor(scene, currentTile, newTile);
                    }
                    else {
                        CreatePassage(scene, currentTile, newTile);
                    }
                    
                    backtrack.push(newTile);
                }
            }
            else {
                CreateWall(scene, ox, oy, x, y, scene);
            }
        }
    }
}

function CreateRoom() {
    var room = {style: CurrentRoomStyle(), tiles: []};
    NextRoomStyle();
    return room;
}

function CreateFloor(scene, x, y, room) {
    var floorI = RandomArrayElement(room.style.floors).createInstance("floor" + x + "_" + y);
    
    floorI.position.x = x * TILE_SIZE;
    floorI.position.z = y * TILE_SIZE;
    
    // NORTH, EAST, SOUTH, WEST TODO maybe not name edges
    floorI.data = {};
    floorI.data.edges = [null, null, null, null];
    
    map.tiles[y][x] = floorI;
    
    // cyclic reference fun
    room.tiles.push(floorI);
    floorI.data.room = room;
    
    return floorI;
}

function CreateDoor(scene, floor1, floor2) {
    var x1 = floor1.position.x / TILE_SIZE;
    var y1 = floor1.position.z / TILE_SIZE;
    var x2 = floor2.position.x / TILE_SIZE;
    var y2 = floor2.position.z / TILE_SIZE;
    
    var direction = GetDirection(x1, y1, x2, y2);
    var inverted = InvertDirection(direction);
    
    var door = RandomArrayElement(floor1.data.room.style.doors).createInstance("passage_"+x1+"_"+y1+"_"+x2+"_"+y2);
    
    var dx = x2 - x1;
    var dy = y2 - y1;
    var direction = GetDirection(x1, y1, x2, y2);
    
    door.position.x = (x1 + dx / 2) * TILE_SIZE;
    door.position.z = (y1 + dy / 2) * TILE_SIZE;
    door.position.y = TILE_SIZE / 2;
    
    // calc rotation
    var rotation = 0;
    switch(direction) {
        case Direction.NORTH:
            rotation = 0;
            break;
        case Direction.SOUTH:
            rotation = Math.PI;
            break;
        case Direction.WEST:
            rotation = Math.PI * 3 / 2;
            break;
        case Direction.EAST:
            rotation = Math.PI / 2;
            break;
    }
    door.rotate(BABYLON.Axis.Y, rotation, BABYLON.Space.WORLD);
    door.data = {
        isPassable: true
    };
    
    floor1.data.edges[direction] = door;
    floor2.data.edges[inverted] = door;
}

function CreatePassage(scene, floor1, floor2) {
    var x1 = floor1.position.x / TILE_SIZE;
    var y1 = floor1.position.z / TILE_SIZE;
    var x2 = floor2.position.x / TILE_SIZE;
    var y2 = floor2.position.z / TILE_SIZE;

    var direction = GetDirection(x1, y1, x2, y2);
    var inverted = InvertDirection(direction);
    
    //var edge = new BABYLON.Mesh("passage_"+x1+"_"+y1+"_"+x2+"_"+y2, scene);
    
    var edge = {
        data: {
            isPassable: true
        }
    }
    
    floor1.data.edges[direction] = edge;
    floor2.data.edges[inverted] = edge;
}

function CreateWall(scene, x1, y1, x2, y2, scene) {
    var floor1 = GetFloor(x1, y1);
    var floor2 = GetFloor(x2, y2);

    var direction = GetDirection(x1, y1, x2, y2);

    var wallI = RandomArrayElement(floor1.data.room.style.walls).createInstance("wall" + x2 + "_" + y2);
    
    if (wallsEnabled) {
        // create hitbox
        var wallHitbox = BABYLON.MeshBuilder.CreateBox("wallhb" + x2 + "_" + y2, {width: TILE_SIZE, height: TILE_SIZE, depth: 0.1}, scene);
        wallHitbox.checkCollisions = true;
        wallHitbox.isVisible = false;
        wallHitbox.parent = wallI;
    }
    else {
        wallI.isVisible = false;
    }
    
    wallI.data = {
        isPassable: false
    };
    floor1.data.edges[direction] = wallI;
    
    var dx = x2 - x1;
    var dy = y2 - y1;
    
    wallI.position.x = (x1 + dx / 2) * TILE_SIZE;
    wallI.position.z = (y1 + dy / 2) * TILE_SIZE;
    wallI.position.y = TILE_SIZE / 2;
    
    // calc rotation
    var rotation = 0;
    switch(direction) {
        case Direction.NORTH:
            rotation = 0;
            break;
        case Direction.SOUTH:
            rotation = Math.PI;
            break;
        case Direction.WEST:
            rotation = Math.PI * 3 / 2;
            break;
        case Direction.EAST:
            rotation = Math.PI / 2;
            break;
    }
    wallI.rotate(BABYLON.Axis.Y, rotation, BABYLON.Space.WORLD);
    
    return wallI;
}

function GetFloor(x, y) {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        return map.tiles[y][x];
    }
    return null;
}

function CurrentRoomStyle() {
    return roomStyles[currentRoomStyleIndex];
}

function NextRoomStyle() {
    currentRoomStyleIndex = (currentRoomStyleIndex + 1) % roomStyles.length;
}

function CreateFloorBase(scene, name, texture) {
    var sourcePlane = new BABYLON.Plane(0, 1, 0, 0);
    sourcePlane.normalize();
    
    var mesh = BABYLON.MeshBuilder.CreatePlane(name + "_floor", {height: TILE_SIZE, width: TILE_SIZE, sourcePlane: sourcePlane}, scene);
    var mat = new BABYLON.StandardMaterial(name + "floor_material", scene);
    
    mat.diffuseTexture = texture;
    mat.ambientColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    mesh.material = mat;
    mesh.isVisible = false;
    
    return mesh;
}

function CreateWallBase(scene, name, texture) {
    var mesh = BABYLON.MeshBuilder.CreatePlane(name + "_wall", {height: TILE_SIZE, width: TILE_SIZE}, scene);
    var mat = new BABYLON.StandardMaterial(name + "_wall_material", scene);
    
    mat.diffuseTexture = texture;
    mat.ambientColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    mesh.material = mat;
    mesh.isVisible = false;
    
    return mesh;
}

function CreateDoorBase(scene, name, texture) {
    var mesh = BABYLON.MeshBuilder.CreatePlane(name + "_door", {height: TILE_SIZE, width: TILE_SIZE, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    var mat = new BABYLON.StandardMaterial(name + "_door_material", scene);
    
    mat.diffuseTexture = texture;
    mat.ambientColor = new BABYLON.Color3(1,1,1);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    
    mesh.material = mat;
    mesh.isVisible = false;
    
    return mesh;
}

function IsFloorComplete(floor) {
    return (floor.data.edges[Direction.NORTH] && 
            floor.data.edges[Direction.SOUTH] && 
            floor.data.edges[Direction.WEST]  && 
            floor.data.edges[Direction.EAST] );
}

function RandomDirection(floor) {
    var directionsLeft = [];

    if (!floor.data.edges[Direction.SOUTH]) {
        directionsLeft.push(Direction.SOUTH);
    }
    if (!floor.data.edges[Direction.NORTH]) {
        directionsLeft.push(Direction.NORTH);
    }
    if (!floor.data.edges[Direction.EAST]) {
        directionsLeft.push(Direction.EAST);
    }
    if (!floor.data.edges[Direction.WEST]) {
        directionsLeft.push(Direction.WEST);
    }
    
    return directionsLeft[Math.floor(Math.random() * directionsLeft.length)];
}

function CanWalk(x, y, direction) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return false;
    }
    return map.tiles[y][x].data.edges[direction].data.isPassable == true;
}

function DirectionToCoords(direction) {
    if (direction == Direction.EAST) {
        return {x: 1, y: 0};
    }
    else if (direction == Direction.WEST) {
        return {x: -1, y: 0};
    }
    else if (direction == Direction.NORTH) {
        return {x: 0, y: 1};
    }
    else if (direction == Direction.SOUTH) {
        return {x: 0, y: -1};
    }
    return null;
}

function GetDirection(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    
    var direction = -1;
    if (dx == 1) {
        direction = Direction.EAST;
    }
    else if (dx == -1) {
        direction = Direction.WEST;
    }
    else if (dy == 1) {
        direction = Direction.NORTH;
    }
    else if (dy == -1) {
        direction = Direction.SOUTH;
    }
    
    return direction;
}

function InvertDirection(direction) {
    switch(direction) {
        case Direction.NORTH:
            return Direction.SOUTH;
        case Direction.SOUTH:
            return Direction.NORTH;
        case Direction.WEST:
            return Direction.EAST;
        case Direction.EAST:
            return Direction.WEST;
    }
    return -1;
}

function RandomArrayElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
