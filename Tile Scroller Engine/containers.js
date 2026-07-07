// Containers

/**
 * @typedef {"center" | "left" | "right"} AlignHor
 * @typedef {"center" | "top" | "bottom"} AlignVer
 * 
 * @typedef {"norm" | "pixel"} BoundsType
 * 
 * @typedef {{text: string; x: number; y: number}} PositionedText
 * 
 * @typedef {Object} BoundsTypesSettings
 * @property {BoundsType?} sizeType
 * @property {BoundsType?} posType
 * @property {BoundsType?} marginType
 * @property {BoundsType?} spaceType
 * 
 * @typedef {Object} ContainerTextSettings
 * @property {CanvasFillStrokeStyles?} color 
 * @property {CanvasTextDrawingStyles?} font
 * @property {CanvasTextBaseline?} textBaseline
 * @property {CanvasTextAlign?} textAlign
 * @property {AlignHor?} alignHor
 * @property {AlignVer?} alignVer 
 * @property {number?} offsetX
 * @property {number?} offsetY
 * @property {CanvasFontVariantCaps} fontVariantCaps 
 * @property {(Container: Container, index: number) => string?} format
 * 
 * @typedef {ContainerTextSettings & PositionedText} ContainerText
 * @typedef {{x: number; y: number; width: number; height: number}} ContainerBounds
 */

class InvalidContainerError extends Error{
    constructor(message){
        super(message);
    }
}

/**
 * @extends {Array<Container>}
 */

class ContainerList extends Array{
    constructor(length = 0){
        super(length);
    }

    show = true;

    /*** @type {Object<string, ContainerText>} */

    textSettings = {};

    /**
     * @param {Object<string, Container>} settings 
     */

    config(settings){
        const ids = Object.keys(settings);

        this.forEach((cont, index) => {
            for(const id of ids){
                if(cont.ids.includes(id)) cont.config(settings[id]);
            }
        });
    }
    
    displayAll(color){
        this.forEach((cont)=>{
            cont.display(color);
        });
    }
    
    fillColor(color){
        this.forEach(cont => {
            cont.fillColor(color);
        });
    }
    
    /**
     * @param {Object<string, ContainerText>} settings 
     */

    displayText(settings = {}){
        const ids = Object.keys(settings);
        
        this.forEach((cont, index)=>{
            for(const id of ids){
                if(cont.ids.includes(id)){
                    const {text, x, y, format, ...rest} = settings[id];

                    const replacementText = !format ? text : text.replaceAll("%s", format(cont, index));
                    cont.displayText(replacementText, x, y, rest);
                }
            }
        });
    }

    /**
     * @param {string} id 
     */

    getAllById(id){
        return this.filter(cont => cont.ids.includes(id));
    }

    update(){
        this.forEach((cont, index) => {
            if(!cont.show) return;

            const m = {...mouseState, y: flipCanvasY(mouseState.y)};

            if(inRect(m, cont.bounds)){
                mainCanvas.style.cursor = cont.hover;

                if(mouseState.hold === 1){
                    cont.click(cont);
                }
            }

            if(cont.fill !== "none") cont.fillColor(cont.fill);
        });

        this.displayText(this.textSettings);
    }
}

const allContainers = new ContainerList();

class Container{
    hasParent = false;
    parentContainer = null;
    
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    marginX = 0;
    marginY = 0;
    spaceX = 0;
    spaceY = 0;

    show = false;
    hover = "default";

    set id(x){
        this.ids.push(x);
    }

    get id(){
        return this.ids;
    }

    /*** @type {string[]} */

    ids = [];

    /**
     * @param {BoundsType} posType 
     * @param {BoundsType} sizeType 
     * @param {BoundsType} marginType
     * @param {BoundsType} spaceType
     */

    constructor(posType = "pixel", sizeType = "pixel", marginType = "pixel", spaceType = "pixel"){
        this.posType = posType;
        this.sizeType = sizeType;
        this.marginType = marginType;
        this.spaceType = spaceType;
    }

    /*** @type {ContainerBounds} */

    get bounds(){
        let x = 0;
        let y = 0;
        let width = 0;
        let height = 0;
        let marginX = 0;
        let marginY = 0;

        const parentBounds = this.parentContainer?.bounds;

        if(this.sizeType === "pixel"){
            width = this.width;
            height = this.height;
        }

        if(this.sizeType === "norm"){
            width = this.width * (this.hasParent? parentBounds.width : mainCanvas.width);
            height = this.height * (this.hasParent? parentBounds.height : mainCanvas.height);
        }

        if(this.marginType === "pixel"){
            marginX = this.marginX;
            marginY = this.marginY;
        }

        if(this.marginType === "norm"){
            marginX = this.marginX * width;
            marginY = this.marginY * height;
        }

        if(this.posType === "pixel"){
            x = this.x + (this.hasParent ? parentBounds.x : 0);
            y = this.y + (this.hasParent ? parentBounds.y : 0);
        }

        if(this.posType === "norm"){
            x = this.hasParent ?
                this.x * parentBounds.width + parentBounds.x :
                this.x * mainCanvas.width;

            y = this.hasParent ?
                this.y * parentBounds.height + parentBounds.y :
                this.y * mainCanvas.height;
        }

        if(this.spaceType === "pixel"){
            x += this.spaceX;
            y += this.spaceY;
        }

        if(this.spaceType === "norm"){
            const offsetX = this.hasParent?
                parentBounds.width : mainCanvas.width;

            const offsetY = this.hasParent?
                parentBounds.height : mainCanvas.height;

            x += this.spaceX * (offsetX - width);
            y += this.spaceY * (offsetY - height);
        }

        x += marginX;
        y += marginY;
        width -= 2 * marginX;
        height -= 2 * marginY;

        return {x, y, width, height};
    }

    /*** @type {ContainerText}} */

    textSettings = {};

    /*** @type {CanvasFillStrokeStyles | "none"} */

    fill = "none";

    /*** @type {CanvasFillStrokeStyles | "none"} */

    displayColor = "none";

    children = new ContainerList();

    get descendants(){
        const descendants = new ContainerList();

        descendants.push(...this.children);

        for(const child of this.children){
            descendants.push(...child.descendants);
        }

        return descendants;
    }

    get family(){
        const family = new ContainerList();

        family.push(this);
        family.push(...this.descendants);

        return family;
    }

    /**
     * @param {Container} options 
     */

    config(options){
        Object.assign(this, options);
    }

    /**
     * @param {CanvasFillStrokeStyles | "none"} color 
     */

    display(color = this.displayColor){
        if(color === "none") return;
        if(!mainCanvasCtx) return;

        mainCanvasCtx.save();
        mainCanvasCtx.strokeStyle = color;
        const {bounds} = this;

        const x = Math.round(bounds.x) + 0.5;
        const y = Math.round(bounds.y) + 0.5;
        const width = Math.round(bounds.width) - 1;
        const height = Math.round(bounds.height) - 1;

        mainCanvasCtx.strokeRect(x, y, width, height);

        mainCanvasCtx.restore();
    }

    clip(){
        const bounds = this.bounds;
        mainCanvasCtx.beginPath();
        mainCanvasCtx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        mainCanvasCtx.closePath();
        mainCanvasCtx.clip();
    }

    /**
     * @param {Container} container 
     */

    addChild(container){
        if(!(container instanceof Container)) throw new InvalidContainerError("Input must be a container");

        container.parentContainer = this;
        container.hasParent = true;

        this.children.push(container);
    }

    /**
     * @param {number} count 
     * @param {BoundsTypesSettings} settings
     * @param {(cont: Container, index: number) => void} common 
     */

    addGroup(count, settings = {}, common = ()=>{}){
        const {
            posType = "pixel",
            sizeType = "pixel",
            marginType = "pixel",
            spaceType = "pixel"
        } = settings;

        const children = new ContainerList();

        for(let i = 0; i < count; i++){
            const child = new Container(posType, sizeType, marginType, spaceType);
            this.addChild(child);
            common(child, i);
            children.push(child);
        }

        return children;
    }

    /**
     * @param {CanvasFillStrokeStyles} color 
     */

    fillColor(color){
        const {bounds} = this;
        const x = Math.floor(bounds.x);
        const y = Math.floor(bounds.y);
            
        mainCanvasCtx.save();
        mainCanvasCtx.fillStyle = color;
        mainCanvasCtx.fillRect(x, y, bounds.width, bounds.height);
        mainCanvasCtx.restore();
    }

    /**
     * @param {string} text 
     * @param {number} x
     * @param {number} y
     * @param {ContainerTextSettings} settings 
     */

    displayText(text, x, y, settings = {}){
        const {
            font,
            color,
            format = () => "",
            textAlign = "left",
            textBaseline = "top",
            alignHor = "left",
            alignVer = "bottom",
            offsetX = 0,
            offsetY = 0,
            fontVariantCaps = "normal"
        } = settings;
        
        mainCanvasCtx.save();
        
        mainCanvasCtx.font = font;
        mainCanvasCtx.textAlign = textAlign;
        mainCanvasCtx.textBaseline = textBaseline;
        mainCanvasCtx.fillStyle = color;
        mainCanvasCtx.fontVariantCaps = fontVariantCaps;
        
        const {bounds} = this;
            
        let textX = x + bounds.x + offsetX;
        let textY = y + bounds.y - offsetY;
        
        switch(alignHor){
            case "center":
                textX += bounds.width / 2;
                break;
            case "left":
                textX += 0;
                break;
            case "right":
                textX += bounds.width;
                break;
        }
                    
        switch(alignVer){
            case "center":
                textY += bounds.height / 2;
                break;
            case "bottom":
                textY += bounds.height;
                break;
            case "top":
                textY += 0;
                break;
        }

        const words = text.split(" ");
        const spaceWidth = mainCanvasCtx.measureText(" ").width;
        let textLine = [];
        let textWidth = 0;
        let textOffsetY = 0;

        for(const word of words){
            const metrics = mainCanvasCtx.measureText(word);
            textWidth += metrics.width + spaceWidth;
            
            if(textWidth < bounds.width){
                textLine.push(word);
                continue;
            }

            mainCanvasCtx.fillText(textLine.join(" "), textX, textY + textOffsetY, bounds.width);
            textLine = [word];
            textWidth = mainCanvasCtx.measureText(word).width;
            textOffsetY += 20;
        }

        mainCanvasCtx.fillText(textLine.join(" "), textX, textY + textOffsetY, bounds.width);
                
        mainCanvasCtx.restore();
    }

    /**
     * @type {(cont: Container) => void};
     */

    click = ()=>{};

    update(displayFill = true, displayText = true){
        if(!this.show) return;

        const {bounds} = this;

        if(inRect(mouseState, bounds)){
            mainCanvas.style.cursor = this.hover;

            if(mouseState.hold === 1){
                this.click(this);
            }
        }
        
        if(this.fill !== "none" && displayFill) this.fillColor(this.fill);

        if(!this.textSettings.text) return;
        
        if(displayText){
            const {text, x = 0, y = 0, ...settings} = this.textSettings;
            this.displayText(text, x, y, settings);
        }
    }
}