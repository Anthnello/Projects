/*** @type {HTMLCanvasElement} */

const mainCanvas = document.getElementById("gameScreen");
const mainCanvasCtx = mainCanvas.getContext("2d");

mainCanvas.width = 980;
mainCanvas.height = 720;

/*** @param {number} y */

function flipWindowY(y){
    return innerHeight - y;
}

/*** @param {number} y */

function flipCanvasY(y){
    return mainCanvas.height - y;
}

function correctCanvasSize(){
    const {style, offsetWidth, offsetHeight, width, height} = mainCanvas;

    if(innerWidth / width > innerHeight / height){
        style.top = 0;
        style.width = (innerHeight * width / height) + "px";
        style.height = innerHeight + "px";
    } else {
        style.width = innerWidth + "px";
        style.height = (innerWidth * height / width) + "px"
        style.top = (innerHeight - offsetHeight) / 2 + "px";
    }
}

// Mouse

const mouseState = {x: 0, y: 0, hold: 0, down: false};

document.onmousemove = e => {
    const {offsetLeft, offsetWidth, width, offsetTop, offsetHeight, height} = mainCanvas;

    const mouseX = (e.clientX - offsetLeft) / offsetWidth * width;
    const mouseY = (e.clientY - offsetTop) / offsetHeight * height;

    mouseState.x = Math.round(mouseX);
    mouseState.y = Math.round(mouseY);
};

document.onmousedown = e => {mouseState.down = true};

document.onmouseup = e => {
    mouseState.down = false;
    mouseState.hold = 0;
};

// Keyboard

/*** @type {Object<string, boolean>} */

const keyboard = {};

document.onkeydown = event => {
    keyboard[event.code] = true;
}

document.onkeyup = event => {
    keyboard[event.code] = false;
}

// Math

/**
 * @param {{x: number, y: number}} p 
 * @param {number[]} b
 */

function boxPointWithBounds(p, b){
    if(p.x < b[0]) p.x = b[0];
    if(p.x > b[1]) p.x = b[1];
    if(p.y < b[2]) p.y = b[2];
    if(p.y > b[3]) p.y = b[3];
}

// Loop

function tick(){};

function gameloop(){
    const {innerWidth, innerHeight} = window;
    if(mouseState.down) mouseState.hold++;

    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    correctCanvasSize();
    
    mainCanvas.style.cursor = "default";
    tick();

    requestAnimationFrame(gameloop);
}

gameloop();