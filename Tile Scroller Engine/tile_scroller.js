/**
 * @typedef {Object} LevelData
 * @property {number} levelWidth
 * @property {number} levelHeight
 * @property {number} tileSize
 * @property {{width: number; height: number}} size
 * @property {number[]} tileList
 * 
 * @typedef {Object} UserData
 * @property {{x: number; y: number}} camera
 * @property {number[]} cameraBounds
 * @property {number} screenWidth
 * @property {number} screenHeight
 */

class LevelBoundsContainer extends Container{
    /**
     * @param {LevelData} levelData
     * @param {UserData} userData
     */
    
    constructor(levelData, userData){
        super();
        this.levelData = levelData;
        this.userData = userData;

        const {levelWidth, levelHeight, tileSize} = levelData;

        this.width = levelWidth * tileSize;
        this.height = levelHeight * tileSize;
    }

    update(){
        const {camera, screenWidth, screenHeight} = this.userData;
        this.x = -camera.x;
        this.y = -camera.y;
    }
}

class VisibleScreenContainer extends Container{
    /**
     * @param {LevelData} levelData
     * @param {UserData} userData
     */

    constructor(levelData, userData){
        super("pixel", "norm", "norm");
        this.levelData = levelData;
        this.userData = userData;

        this.width = 1;
        this.height = 1;

        this.marginX = 0.2;
        this.marginY = 0.2;

        const size = levelData.size;
        const bounds = this.bounds;

        userData.cameraBounds = [
            0, size.width - bounds.width,
            0, size.height - bounds.height
        ];

        userData.screenWidth = bounds.width;
        userData.screenHeight = bounds.height;
    }
}

class TileScrollerContainer extends Container{
    /**
     * @param {LevelData} levelData
     * @param {UserData} userData
     * @param {ContainerBounds} bounds
     */

    constructor(levelData, userData, bounds){
        super("pixel", "pixel", "norm");
        this.levelData = levelData;
        this.userData = userData;
        
        const tileSize = levelData.tileSize;

        this.tileCountX = Math.ceil(bounds.width / tileSize) + 1;
        this.tileCountY = Math.ceil(bounds.height / tileSize) + 1;

        this.width = this.tileCountX * tileSize;
        this.height = this.tileCountY * tileSize;

        /*** @type {TileLoader[]} */

        this.tileLoaders = new ContainerList();

        for(let tx = 0; tx < this.tileCountX; tx++){
            for(let ty = 0; ty < this.tileCountY; ty++){
                const tileLoader = new TileLoader(tx, ty, this.levelData, this.userData);
                this.tileLoaders.push(tileLoader);
                this.addChild(tileLoader);
            }
        }
    }

    get cameraTile(){
        const camera = this.userData.camera;
        const tileSize = this.levelData.tileSize;

        return {
            x: Math.floor(camera.x / tileSize),
            y: Math.floor(camera.y / tileSize)
        };
    }

    update(){
        boxPointWithBounds(this.userData.camera, this.userData.cameraBounds);

        const camera = this.cameraTile;
        const tileSize = this.levelData.tileSize;
        this.x = camera.x * tileSize;
        this.y = camera.y * tileSize;
    }
}

class TileLoader extends Container{
    /**
     * @param {number} tileX 
     * @param {number} tileY 
     * @param {LevelData} levelData 
     * @param {UserData} userData 
     */

    constructor(tileX, tileY, levelData, userData){
        super();
        this.tileX = tileX;
        this.tileY = tileY;
        this.levelData = levelData;
        this.userData = userData;

        const tileSize = levelData.tileSize;
        this.width = tileSize;
        this.height = tileSize;
        this.x = tileX * tileSize;
        this.y = tileY * tileSize;

        this.colors = ["green", "blue"];
    }

    get cameraTile(){
        const camera = this.userData.camera;
        const tileSize = this.levelData.tileSize;

        return {
            x: Math.floor(camera.x / tileSize),
            y: Math.floor(camera.y / tileSize)
        };
    }

    get tileIndex(){
        const cameraTile = this.cameraTile;
        const levelHeight = this.levelData.levelHeight;

        const tx = this.tileX + cameraTile.x;
        const ty = this.tileY + cameraTile.y;

        return levelHeight * tx + ty;
    }

    update(){
        const tile = this.levelData.tileList[this.tileIndex];
        const color = this.colors[tile-1];
        
        if(!color) return;

        this.fillColor(color);
    }
}

class TileScroller{
    /**
     * @param {number} levelWidth 
     * @param {number} levelHeight 
     * @param {number} tileSize 
     */

    constructor(levelWidth, levelHeight, tileSize){
        /*** @type {LevelData} */

        this.levelData = {
            levelWidth,
            levelHeight,
            tileSize,
            tileList: [],
            
            get size(){
                return {
                    width: this.levelWidth * this.tileSize,
                    height: this.levelHeight * this.tileSize
                };
            }
        };

        this.levelData.tileList = this.createTileList();

        /*** @type {UserData} */
        this.userData = {
            camera: {x: 0, y: 0},
            cameraBounds: [0, 0, 0, 0],
            screenWidth: 0,
            screenHeight: 0
        };

        const p = [this.levelData, this.userData];
        
        this.levelBounds = new LevelBoundsContainer(...p);
        this.visibleScreen = new VisibleScreenContainer(...p);
        this.tileScroller = new TileScrollerContainer(...p, this.visibleScreen.bounds);
        this.tileLoaders = this.tileScroller.tileLoaders;

        this.visibleScreen.addChild(this.levelBounds);
        this.levelBounds.addChild(this.tileScroller);
    }

    display(){
        this.levelBounds.display("green");
        this.tileLoaders.displayAll("red");
        this.tileScroller.display("rgb(0, 213, 255)");
        this.visibleScreen.display("yellow");
    }

    createTileList(){
        const {levelWidth, levelHeight} = this.levelData;

        const tileList = Array(levelHeight).fill(1);

        for(let i = 0; i < levelWidth - 2; i++){
            const boxedColumn = [1];

            for(let j = 0; j < levelHeight - 2; j++){
                boxedColumn.push(Math.random() > 0.2 ? 0 : 2);
            }

            boxedColumn.push(1);

            tileList.push(...boxedColumn);
        }

        tileList.push(...Array(levelHeight).fill(1));

        return tileList;
    }

    update(){
        this.tileScroller.update();
        this.levelBounds.update();
        this.tileLoaders.forEach(tileLoader => {tileLoader.update()});
    }
}