const tileScroller = new TileScroller(32, 32, 128);
const player = new PlayerDummy(tileScroller);

const camera = tileScroller.userData.camera;

function tick(){
    // if(keyboard["KeyA"]) camera.x -= 5;
    // if(keyboard["KeyD"]) camera.x += 5;
    // if(keyboard["KeyW"]) camera.y -= 5;
    // if(keyboard["KeyS"]) camera.y += 5;
    
    player.update();
    tileScroller.update();
    tileScroller.display();
    player.draw();
}