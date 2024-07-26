let level = document.getElementById('level');
let background = document.getElementById('background');

let levelCtx = level.getContext('2d'); //The actual Level
let bgCtx = background.getContext('2d'); //The background

let raf;

levelCtx.save();
bgCtx.save();

// The Floor
function minMax(min,max){ //Gives a random number between min and max
    let ranNum = Math.floor(Math.random()*(max-min+1))+min;
    return ranNum;
}

function levelGen(){ //Generates the level Heights and widths 
    let xStart = 720;
    let yStart = 700;
    let levelDesign = [[0,yStart],[xStart,yStart]];
    while(levelDesign[levelDesign.length-1][0] < level.width){
        let x = levelDesign[levelDesign.length-1][0] + minMax(480,1080);
        let y = levelDesign[levelDesign.length-1][1] + minMax(-125,125);

        if( y > 811){ //y can't be below the screen
            y = 700;
        }

        if(x > level.width){ //x cannot be greater than level width
            x = level.width;
        }

        levelDesign.push([x,y]);
    }
    console.log(levelDesign);
    return levelDesign;
}

const floorAndWalls = { //Object which stores the level desgign and draws it on canvas
    levelDesign : levelGen(),
    startYpos : 700,
    yLeast : 650,
    putValue(){
        for(let i=0;i<this.levelDesign.length-1;i++){

            let x1 = this.levelDesign[i][0];
            let y1 = this.levelDesign[i][1];
            let x2 = this.levelDesign[i+1][0];
            let y2 = this.levelDesign[i+1][1];

            draw(x1,y1,x1,y2);
            draw(x1,y2,x2,y2);
        }
    } 
}

function draw(x1,y1,x2,y2){ //Functions which draws the floor and walls
    levelCtx.save();
    levelCtx.beginPath();

    levelCtx.moveTo(x1,y1);
    levelCtx.lineTo(x2,y2);

    levelCtx.stroke();
    levelCtx.restore();
}

//The character
const character = {
    x : 50,
    y : floorAndWalls.startYpos - 50,
    yLeast : floorAndWalls.startYpos - 50,
    height : 50,
    width : 50,
    vx : 0,
    vy : 0,
    jumping : false,
    crouching : false,
    color : 'red',
    draw(){ //Draw function
        levelCtx.save();
        levelCtx.fillStyle = character.color;
        levelCtx.fillRect(character.x,character.y,character.width,character.height);
        levelCtx.restore();
    },
    right(){ //Right function to make the block move right
        character.vx += 1.2;
    },
    left(){ //Left function to make the block move Left
        character.vx -= 1.2;
    },
    crouch(){ //Makes the block crouch
        if(controller['s'].pressed && character.crouching == false){
            character.yLeast += 25;
            character.height = 25;
            character.crouching = true;
        }
    },
    jump(){ //Makes the block jump
        if(controller['w'].pressed && character.jumping == false){
            character.vy -= 30;
            character.jumping = true;
        }
    }
}

const controller = { // The controller which sees which keys are pressed 
    'd':{pressed : false, func : ()=>{character.right()} },
    'a':{pressed : false, func : ()=>{character.left()} },
    'w':{pressed : false, func : ()=>{character.jump()} },
    's':{pressed : false, func : ()=>{character.crouch()} }
}

const executeMoves = () => { //Links the controllers pressed keys with their functions
    Object.keys(controller).forEach(key=> {
        controller[key].pressed && controller[key].func() 
    })
}

//Camera Movement
function checkCam(){
    let charX = character.x;
    let xNash = 500;
    if(charX < xNash){
        level.style.left = '0';
    } else if(charX > xNash && charX < level.width - (1440 - xNash)){
        level.style.left = `-${charX - xNash}px`;
    } else if(charX > 2980){
        level.style.right = '0';
    }
}

function movePlayer(){ //Moves the player
    character.vy += 1.5; //Gravity
    character.x += character.vx; //Tells block to go right/left
    character.y += character.vy; //Tells block to go up
    character.vy *= 0.9; //Friction
    character.vx *= 0.9; //Friction
    
    if(character.y > character.yLeast){ //Makes the character not go below the floor
        character.y = character.yLeast;
        character.jumping = false;
        character.vy = 0;
    }

    if(controller['s'].pressed == false && character.crouching == true){ //Makes the crouch key a hold key
        character.yLeast -= 25; //Fix crouching
        character.height = 50;
        character.crouching = false;
    }
}

function animate(){ //The animation function 
    levelCtx.clearRect(0,0,level.width,level.height);

    executeMoves();
    floorAndWalls.putValue();
    checkContact();
    movePlayer();
    character.draw();
    checkCam();

    raf = window.requestAnimationFrame(animate);
}

window.addEventListener('keydown',(e)=>{ //If the button is pressed, the pressed value in controller for corresponding button becomes true
    if(controller[e.key]){
        controller[e.key].pressed = true;
    }
})

window.addEventListener('keyup',(e)=>{ //Reverse of above comment
    if(controller[e.key]){
        controller[e.key].pressed = false;
    }
})

animate(); //Main Function callBack

//Checks if block is hitting any walls or floor
function checkContact(){
    let levelArr = floorAndWalls.levelDesign;
    let charXStart = character.x;
    let charXFin = character.x + character.width;
    let charYDown = character.y + character.height;
    let indexS;
    let indexF;

    for(let i=0;i<levelArr.length;i++){ //Checks where the start of the block is
        if(charXStart - 15 < levelArr[i][0]){
            indexS = i;
            break;
        }
    }

    for(let i=0;i<levelArr.length;i++){ //Checks where the end of the block is
        if(charXFin + 15 < levelArr[i][0]){
            indexF = i;
            break;
        }
    }

    //Player is at the end
    if(indexS == levelArr.length - 1){
        character.yLeast = levelArr[indexS][1] - character.height;
    }
    
    //Forward Movement
    else if(levelArr[indexS][1] > levelArr[indexS + 1][1] && charXFin > levelArr[indexS][0]){ //Checks if the next area is higher than current area and if end of the character is at edge of current area 
        if(charYDown > levelArr[indexS + 1][1]){ //Checks if character is below the height of next area
            character.x = levelArr[indexS][0] - character.width; //Makes the character not go beyond the wall of current area
        } else if(charYDown < levelArr[indexS + 1][1]){ //Checks if character is above the height of next area
            character.yLeast = levelArr[indexS + 1][1] - character.height; //Makes the yLeast equal to next area's y position
        }
    } else if(levelArr[indexS][1] < levelArr[indexS + 1][1] && charXStart > levelArr[indexS][0]){ //Checks if the next area is lower than current area and if start of the character is at edge of current area
        character.yLeast = levelArr[indexS + 1][1] - character.height; //Makes the yLeast equal to next area's y position
    }

    //Player is at the beginning
    if(indexF == 0){
        character.yLeast = levelArr[0][1] - character.height;
    }

    //Backward movement
    else if(levelArr[indexF - 1][1] < levelArr[indexF][1] && charXStart < levelArr[indexF - 1][0]){//Checks if the previous area is higher than current area and if start of the character is at edge of current area
        if(charYDown > levelArr[indexF - 1][1]){
            character.x = levelArr[indexF - 1][0];
        } else if(charYDown < levelArr[indexF - 1][1]){
            character.yLeast = levelArr[indexF - 1][1] - character.height;
        }
    } else if(levelArr[indexF - 1][1] > levelArr[indexF][1] && charXFin < levelArr[indexF - 1][0]){//Checks if the previous area is lower than current area and if end of the character is at edge of current area
        character.yLeast = levelArr[indexF - 1][1] - character.height;
    }

    if(charXStart < 0){ //To not allow character to go left beyond start
        character.x = 0;
    }
 
    if(charXFin > level.width - 30){ //To not allow character to go right beyond end
        character.x = level.width - character.width - 30;
    }
}