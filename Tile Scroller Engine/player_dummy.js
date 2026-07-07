class PlayerDummy{
    /*** @param {TileScroller} tileScroller */

    constructor(tileScroller){
        this.tileScroller = tileScroller;

        this.levelData = tileScroller.levelData;
        this.userData = tileScroller.userData;

        const {tileSize, levelHeight} = this.levelData;
        
        this.x = tileSize * 1.5 - 16;
        this.y = tileSize * levelHeight / 2 - 16;
        this.speedX = 0;
        this.speedY = 0;

        this.width = 32;
        this.height = 32;
    }

    /**
     * @param {number} x 
     * @param {number} y
     */

    tilePositionAt(x, y){
        const tileSize = this.levelData.tileSize;

        return {
            x: Math.floor((this.x + x) / tileSize),
            y: Math.floor((this.y + y) / tileSize)
        };
    }

    /**
     * @param {number} x 
     * @param {number} y 
     */

    getTileAt(x, y){
        const {x: tileX, y: tileY} = this.tilePositionAt(x, y);

        const levelHeight = this.levelData.levelHeight;
        const tileIndex = levelHeight * tileX + tileY;

        return this.levelData.tileList[tileIndex];
    }

    update(){
        if(keyboard["KeyD"]){
            this.speedX = 5;
        } else if(keyboard["KeyA"]){
            this.speedX = -5;
        } else {
            this.speedX = 0;
        }

        if(keyboard["KeyW"]){
            this.speedY = -5;
        } else if(keyboard["KeyS"]){
            this.speedY = 5;
        } else {
            this.speedY = 0;
        }

        this.x += this.speedX;
        this.horizontalCollision();

        this.y += this.speedY;
        this.verticalCollision();

        const {camera, screenWidth, screenHeight} = this.userData;

        camera.x = this.x - (screenWidth - this.width) / 2;
        camera.y = this.y - screenHeight / 2 + this.height;
    }

    checkForCollision(){
        const w = this.width - 1;
        const h = this.height - 1;

        let points = 0;
        points += this.getTileAt(0, 0) !== 0;
        points += this.getTileAt(w, 0) !== 0;
        points += this.getTileAt(0, h) !== 0;
        points += this.getTileAt(w, h) !== 0;
        return points;
    }

    horizontalCollision(){
        if(this.checkForCollision()){
            const tileSize = this.levelData.tileSize;
            
            this.x -= this.speedX;
            const tilePosition = this.tilePositionAt(0, 0);
            this.x = tilePosition.x * tileSize + (tileSize - this.width) * (this.speedX > 0);
            
            this.speedX = 0;
        }
    }

    verticalCollision(){
        if(this.checkForCollision()){
            const tileSize = this.levelData.tileSize;
            
            this.y -= this.speedY;
            const tilePosition = this.tilePositionAt(0, 0);
            this.y = tilePosition.y * tileSize + (tileSize - this.height) * (this.speedY > 0);
            
            this.speedY = 0;
        }
    }

    draw(){
        const bounds = this.tileScroller.levelBounds.bounds;
        const camera = this.userData.camera;
        const x = bounds.x + this.x;
        const y = bounds.y + this.y;

        mainCanvasCtx.save();

        mainCanvasCtx.fillStyle = "rgb(28, 221, 255)";
        mainCanvasCtx.fillRect(x, y, this.width, this.height);

        mainCanvasCtx.restore();
    }
}