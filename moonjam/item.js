

let BOSS_KEY_ID = "Boss Key";

let ITEM_SIZE = 5;

function CreateItem(name, texture, x, y, res) {
    var item = BABYLON.MeshBuilder.CreatePlane("item", {height: ITEM_SIZE, width: ITEM_SIZE}, scene);
    
    var mat = new BABYLON.StandardMaterial("item_material", scene);
    mat.diffuseTexture = texture;
    mat.ambientColor = new BABYLON.Color3(.8,.8,.8);
    mat.specularColor = new BABYLON.Color3(0,0,0);
    item.material = mat;
    
    item.position.x = x * TILE_SIZE;
    item.position.y = ITEM_SIZE / 2 + TILE_SIZE / 8;
    item.position.z = y * TILE_SIZE;
    item.data = {
        name: name,
        texture: texture,
        res: res,
    };
    
    return item;
}
