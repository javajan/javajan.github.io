

function CreateBossInfo(index) {
    if (index == 0) {
        return {
            patternIndex: 0,
            patternTimer: 0,
            patterns: [
            {
                duration: 10000,
                function: AttackPatternDirect, 
            },
            {
                duration: 10000,
                function: AttackPatternCircle, 
            },
            {
                duration: 10000,
                function: AttackPatternEasy, 
            },
            {
                duration: 10000,
                function: AttackPatternCircleClosingAndOpening, 
            },
            {
                duration: 10000,
                function: AttackPatternRandom, 
            },
            ],
            attackTimer: 0,
            damage: 5,
            takeDamage: function(enemy, d) {
                enemy.data.health -= d;
                enemy.data.timeLastDamage = time;
            },
            health: 100,
            timeLastDamage: -Infinity,
            openedDoors: [],
            inventory: {
                items: [],
            },
            update: function(boss) {
                var index = boss.data.patternIndex;
                var patterns = boss.data.patterns;
                var pattern = boss.data.patterns[index];
                
                pattern.function(boss, pattern);
                
                // new pattern if timer                
                boss.data.patternTimer += engine.getDeltaTime();
                if (boss.data.patternTimer > pattern.duration) {
                    boss.data.patternIndex = (index + 1) % boss.data.patterns.length;
                    boss.data.patternTimer = 0; 
                }
            },
        };
    }
    
    return null;
}

function BossShoot(boss, direction, speed) {
    SpawnProjectile(boss.position, {
        direction: direction,
        destroyTimer: 5000,
        speed: speed,
        damage: boss.data.damage,
    });
}

function AttackPatternCircleRandom(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var dx = Math.sin(t);
        var dy = Math.cos(t);

        var direction = new BABYLON.Vector3(dx, 0, dy);
        BossShoot(boss, direction, 0.1);
        
        var dx = Math.sin(Math.random()*Math.PI*2);
        var dy = Math.cos(Math.random()*Math.PI*2);

        direction = new BABYLON.Vector3(dx, 0, dy);
        BossShoot(boss, direction, 0.1);
    }
}

function AttackPatternDirect(boss, pattern) {
    var attackTime = 400;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var randomOffsetX = Math.random() < 0.5 ? -1:1;
        var randomOffsetY = Math.random() < 0.5 ? -1:1;
        
        var direction = player.position.subtract(boss.position).normalize();
        direction.x += Math.random() * 0.5 * randomOffsetX;
        direction.z += Math.random() * 0.5 * randomOffsetY;

        BossShoot(boss, direction, 0.1);
    }
}


function AttackPatternShotgun(boss, pattern) {
    var attackTime = 400;
    var t = time / 100;

    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var direction = player.position.subtract(boss.position).normalize();
        var offsets = [Math.PI, Math.PI / 20, Math.PI / 40, Math.PI / 60, Math.PI / 80, 0];
        
        offsets.forEach(offset => {
            var dx = Math.sin(t + offset);
            var dy = Math.cos(t + offset);

            var direction = new BABYLON.Vector3(dx, 0, dy);

            BossShoot(boss, direction, 0.1);
        });
    }
}

// Shoots a in a circle but predefined
function AttackPatternEasy(boss, pattern) {
    var attackTime = 50;
    var t = time / 100;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var dx = Math.sin(t);
        var dy = Math.cos(t);

        var direction = new BABYLON.Vector3(dx, 0, dy);

        BossShoot(boss, direction, 0.1);
    }
}

function AttackPatternRandom(boss, pattern) {
    var attackTime = 100;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var dx = Math.sin(Math.random()*Math.PI*2);
        var dy = Math.cos(Math.random()*Math.PI*2);

        var direction = new BABYLON.Vector3(dx, 0, dy);

        BossShoot(boss, direction, 0.1);
    }
}

// Shoots a lot of projectiles in a circle but circle is slow
function AttackPatternCircle(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var dx = Math.sin(t);
        var dy = Math.cos(t);

        var direction = new BABYLON.Vector3(dx, 0, dy);

        BossShoot(boss, direction, 0.1);
    }
}

// like AttackPatternCircle but 4 lines
function AttackPatternCircle4(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var offsets = [0, Math.PI / 2, Math.PI, Math.PI * 4 / 3];
        
        offsets.forEach(offset => {
            var dx = Math.sin(t + offset);
            var dy = Math.cos(t + offset);

            var direction = new BABYLON.Vector3(dx, 0, dy);

            BossShoot(boss, direction, 0.1);
        });
    }
}

// like AttackPatternCircle distance between projectiles becomes more and less over time
function AttackPatternCircleClosingAndOpening(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    var distance = (Math.sin(t) + 1) / 2 * Math.PI / 4;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var offsets = [0, Math.PI / 2 + distance, Math.PI, Math.PI * 4 / 3 + + distance];
        
        
        offsets.forEach(offset => {
            var dx = Math.sin(t + offset);
            var dy = Math.cos(t + offset);

            var direction = new BABYLON.Vector3(dx, 0, dy);

            BossShoot(boss, direction, 0.1);
        });
    }
}

function AttackPatternCircleNotAlways(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    var sin = Math.sin(t * 2);
    var d = sin < 0 ? -1 : 1;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        if (Math.abs(sin) < 0.8) {
            var offsets = [0, Math.PI / 2, Math.PI, Math.PI * 4 / 3];
        
            offsets.forEach(offset => {
                var dx = Math.sin(t + offset) * d;
                var dy = Math.cos(t + offset) ;

                var direction = new BABYLON.Vector3(dx, 0, dy);
    
                BossShoot(boss, direction, 0.1);
            });
        }
    }
}

function AttackPatternCircleOppsiteDirection(boss, pattern) {
    var attackTime = 100;
    var t = time / 1000;
    
    var sin = Math.sin(t * 2);
    var d = sin < 0 ? -1 : 1;
    
    boss.data.attackTimer += engine.getDeltaTime();
    if (boss.data.attackTimer >= attackTime) {
        boss.data.attackTimer = boss.data.attackTimer - attackTime;
        
        var offsets = [0, Math.PI / 2, Math.PI, Math.PI * 4 / 3];
        
        offsets.forEach(offset => {
            var dx = Math.sin(t + offset) * d;
            var dy = Math.cos(t + offset) ;

            var direction = new BABYLON.Vector3(dx, 0, dy);

            BossShoot(boss, direction, 0.1);
        });
    }
}













