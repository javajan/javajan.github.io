

var healthText, sprintText, infoText, bossHealthText;
var gunImage;
var inventoryImages;

function GUIInit(scene) {
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    healthText = new BABYLON.GUI.TextBlock();
    healthText.color = "white";
    healthText.fontSize = 24;
    healthText.width = 0.07;
    healthText.height = 0.05;
    healthText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    healthText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    healthText.fontFamily = "Silkscreen";
    
    sprintText = new BABYLON.GUI.TextBlock();
    sprintText.color = "white";
    sprintText.fontSize = 24;
    sprintText.width = 0.12;
    sprintText.height = 0.05;
    sprintText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    sprintText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    sprintText.fontFamily = "Silkscreen";
    
    infoText = new BABYLON.GUI.TextBlock();
    infoText.color = "white";
    infoText.fontSize = 24;
    infoText.width = 0.9;
    infoText.height = 1;
    infoText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    infoText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    infoText.fontFamily = "Silkscreen";
    
    gunImage = new BABYLON.GUI.Image("gun", "res/gun.png");
    gunImage.height = "512px";
    gunImage.width = "512px";
    
    gunImage.cellId = 0;
    gunImage.cellWidth = 512;
    gunImage.cellHeight = 512;
    
    gunImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gunImage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    gunImage.top = 50;
    
    var inventoryGrid = new BABYLON.GUI.Grid();
    inventoryGrid.addColumnDefinition(1, false);
    inventoryGrid.addColumnDefinition(100, true);
    
    inventoryImages = [];
    for (var i=0; i<INVENTORY_CAPACITY; i++) {
        inventoryGrid.addRowDefinition(1 / INVENTORY_CAPACITY);
    
        var image = new BABYLON.GUI.Image("inventory_image", null);
        image.height = "64px";
        image.width = "64px";
        
        inventoryGrid.addControl(image, i, 1);
        inventoryImages.push(image);
    }
    
    bossHealthText = new BABYLON.GUI.TextBlock();
    bossHealthText.color = "white";
    bossHealthText.fontSize = 24;
    bossHealthText.width = 0.5;
    bossHealthText.height = 0.05;
    bossHealthText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    bossHealthText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    bossHealthText.fontFamily = "Silkscreen";
    
    advancedTexture.addControl(gunImage);
    advancedTexture.addControl(healthText);
    advancedTexture.addControl(sprintText);
    advancedTexture.addControl(inventoryGrid);
    advancedTexture.addControl(infoText);
    advancedTexture.addControl(bossHealthText);
}
