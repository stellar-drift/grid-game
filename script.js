console.log("Script is running!!"); //  debug logging


/* DOM CONTENT WRAPPER *****************************************/
// kind of like main() sorta
// content in this wrapper will wait until the HTML document is loaded before running
document.addEventListener("DOMContentLoaded", () => {
    
    // build grid
    const gameContainer = document.getElementById("game-container");
    const totalCells = 15 * 20; // 15 columns x 20 rows
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        gameContainer.appendChild(cell);
    }


    // select built cells
    window.cells = document.querySelectorAll('.cell');


    // start game
    spawnBlock(); // start spawn mechanic
    startAnimation();


    // controls
    document.addEventListener("keydown", handleKeyPress); // "listen" for keyboard presses
    document.getElementById('restartButton').addEventListener('click', () => {
        document.getElementById('gameOverOverlay').style.visibility = 'hidden';
        resetGame();
    });


    // music 
    const audio = document.getElementById('backgroundMusic');
    const playBtn = document.getElementById('playBtn');

    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playBtn.textContent="pause music";
        } else {
            audio.pause();
            playBtn.textContent = "play music";
        }
    });

});



/* GLOBAL VARIABLES *****************************************/

// CONSTANTS
const rows = 20;
const cols = 15;

// utility / helpter function to convert (row, col) to index (helper function: small reusable fxn that performs a specific task to support a larger fxn or program)
function getIndex(row, col) // function: keyword; getIndex: function name; (row, col): parameters - row and column numbers
{
    return row * cols + col; // row * cols: the number of cells in all rows above the one you're on; 
                                // + col: adds the column offset within the current row
                                // results in the index of the specific cell
}

// grid state / create a matrix that matches game layout:
const grid = Array.from({ length: rows }, () => Array(cols).fill(0)); // create a 2D array to track which cells are occupied (0 = empty, 1 = filled)


// COLOR & SHAPE CONFIGURATION
let currentBlock; 
const colorChoice = ["#2DB973", "#D88C00", "#800080", "#C40000", "#2197C7", "#FF74AF", "#FFD700"]; // green, orange, purple, red, blue, pink, yellow 
let colorChoiceLocked = ["#27A064", "#C47F00", "#6C006C", "#B10000", "#1C7EA6", "#FF60A4", "#EBC600"]; // same colors in order, but darker shade

function getRandomColor() {
    return colorChoice[Math.floor(Math.random() * colorChoice.length)]; // allow each shape to get its own color independently
}



/* SHAPE DICTIONARY *****************************************/
const shapes = {
  O: [[0,0], [0,1], [1,0], [1,1]],
  I: [[0,0], [1,0], [2,0], [3,0]],
  L: [[0,0], [1,0], [2,0], [2,1]],
  J: [[0,1], [1,1], [2,1], [2,0]],
  T: [[0,0], [0,1], [0,2], [1,1]],
  S: [[1,0], [1,1], [0,1], [0,2]],
  Z: [[0,0], [0,1], [1,1], [1,2]]
};

function spawnBlock() {
    const shapeNames = Object.keys(shapes);
    const randomShape = shapeNames[Math.floor(Math.random() * shapeNames.length)];
    const colorIndex = Math.floor(Math.random() * colorChoice.length);

    currentBlock = {
        shape: randomShape,
        colorIndex: colorIndex,
        row: 0,
        col: Math.floor((cols - 4) / 2),
        currentOffsets: shapes[randomShape], // set starting shape
        get color() {
            return colorChoice[this.colorIndex]; 
        },
        get lockedColor() {
            return colorChoiceLocked[this.colorIndex];
        },
        get offsets() {
            return this.currentOffsets;
        },
        get positions() {
            return this.offsets.map(([dRow, dCol]) => {
                const row = this.row + dRow;
                const col = this.col + dCol;
                return getIndex(row, col);
            });
        }

    };

    drawBlock(currentBlock.positions, currentBlock.color); // show block before first animation tick so that it spawns on row 0 instead of row 1
}


function drawBlock(indexArray, color)  // indexArray: any array of grid indexes
{
    indexArray.forEach(index => { // .forEach: loops over the array and colors each one; uses arrow fxn 
        cells[index].style.backgroundColor = color; // color: a string like "yellow" or "#000"
    })
}


/* ANIMATION *****************************************/

// helper function to check if a block can move
function canMoveTo(row, col, shapeOffsets) {
    return shapeOffsets.every(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;

        // check bounds BEFORE accessing grid
        if (
            newRow < 0 || newRow >= rows ||
            newCol < 0 || newCol >= cols
        ) {
            return false;
        }

        // check if cell is already filled 
        return grid[newRow][newCol] === 0;
    });
}



// helper function to clear a block
function clearBlock(indexArray){
    indexArray.forEach(index => {
        cells[index].style.backgroundColor = ""; // resets to default
    });
    /* the arrow fxn:
            function() => {...}
    */
}


// animate using setInterval
let animationInterval;

function startAnimation() {
    
    // set up setInterval to automatically run every 500 milliseconds
    animationInterval = setInterval(() => {
        clearBlock(currentBlock.positions); // clear the current oBlock's old position before moving down
       
        const nextRow = currentBlock.row + 1;     // check potential next position 
        const shapeOffsets = currentBlock.offsets;

        // call helper fxn to check if shape can move down one row.
        if (!canMoveTo(nextRow, currentBlock.col, shapeOffsets)) {     // ! means if the move is NOT safe, then enter this block.   
            // stop animation and lock the block                    
            clearInterval(animationInterval);   // stop the falling animation (setInterval) from continuing
            drawBlock(currentBlock.positions, currentBlock.color);   // redraw in final position, ensure it's visible after landing

            // lock the cells in the grid
            currentBlock.positions.forEach(index => {       // for each index
                const row = Math.floor(index / cols); // gets the row number: divides index by number of columns (15) to get a decimal row number. Math.floor() rounds it down to the whole row.
                const col = index % cols; // gets the column number: remainder gives you the column number within that row.
                grid[row][col] = 1; // marks that cell as 'occupied' in the logical grid
                cells[index].style.backgroundColor = currentBlock.lockedColor; // change color of locked block
            });

            // check for game over
            if (isGameOver()) {
                clearInterval(animationInterval);   // stop animation
                document.getElementById('gameOverOverlay').style.visibility = 'visible';    // show a ui message
                document.removeEventListener("keydown", handleKeyPress);    // remove event listeners 
                return;
            }

            spawnBlock(); // spawn new shape after old shape locks
            startAnimation();
            return; // stops the rest of the code in the setInterval function from running and exits
        }

        currentBlock.row++; // move block down: current row + 1
        drawBlock(currentBlock.positions, currentBlock.color); // draw new block

    }, 500); 
}


/* CONTROLLER *****************************************/

// function to handle the key press
function handleKeyPress(event) {
    if (event.key === "ArrowLeft") {        // === is called a 'strict equality operator'. it compares both value and type. avoids accidental mismatches or type coercion
        moveBlock(-1); // move block left
    } else if (event.key === "ArrowRight") {    // in these cases using === means the event.key will always be a string like "ArrowRight"
        moveBlock(1); // move block right 
    } else if (event.key === "ArrowDown") {
        const nextRow = currentBlock.row + 1;

        if (canMoveTo(nextRow, currentBlock.col, currentBlock.offsets)) {
            clearBlock(currentBlock.positions);
            currentBlock.row = nextRow;
            drawBlock(currentBlock.positions, currentBlock.color);
        }
    } else if (event.key === "a") { // rotate left (counterclockwise)
        rotateBlock(false);
    } else if (event.key === "s") { // rotate right (clockwise)
        rotateBlock(true);
    }
}


// function to move the block horizontally
function moveBlock(direction) {
    const newCol = currentBlock.col + direction;

    // reuse offset-based collision checking
    if (!canMoveTo(currentBlock.row, newCol, currentBlock.offsets)) return;

    clearBlock(currentBlock.positions);
    currentBlock.col = newCol;
    drawBlock(currentBlock.positions, currentBlock.color);
}


function rotateOffsetsClockwise(offsets) {
    return offsets.map(([dRow, dCol]) => [dCol, -dRow]); 
}

// function to rotate the block clockwise or counterclockwise
function rotateBlock(clockwise = true) {
    clearBlock(currentBlock.positions);

    // rotate currentOffsets by 90 deg clockwise or counterclockwise
    let rotatedOffsets;
    if (clockwise) {
        rotatedOffsets = rotateOffsetsClockwise(currentBlock.currentOffsets);
    } else {
        // for counterclockwise rotation, rotate 3 times clockwise
        rotatedOffsets = currentBlock.currentOffsets;
        for (let i = 0; i < 3; i++) {
            rotatedOffsets = rotateOffsetsClockwise(rotatedOffsets);
        }
    }

    // check if the rotated block can fit in current position
    if (canMoveTo(currentBlock.row, currentBlock.col, rotatedOffsets)) {
        currentBlock.currentOffsets = rotatedOffsets;
    }
    // else do nothing (reject rotatiobn)

    drawBlock(currentBlock.positions, currentBlock.color);
}



function isGameOver(){
    // check if any cell in the top row is occupied
    for (let col = 0; col < cols; col++) {
        if (grid[0][col] === 1) {
            return true;
        }
    }
    return false;
}

function resetGame() {
    // clear grid state
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid[r][c] = 0;
        }
    }

    // clear all cell colors
    cells.forEach(cell => {
        cell.style.backgroundColor = "";
    });

    // clear any ongoing animation interval
    clearInterval(animationInterval);

    // re-attach key listener
    document.addEventListener("keydown", handleKeyPress);

    // spawn new block and restart animation
    spawnBlock();
    startAnimation();
}





/* NOTE TO SELF 
const cells = document.querySelectorAll('.cell');   // DOM reference (Document Object Model)
                                                        // grab all elements with class 'cell'. return a NodeList (like an array you can loop over)
                                                        // store in 'cells' variable
                                                        // 'const' keyword defines a constant reference to a value (not a constant value)
                                                        // 'document' refers to entire webpage (the DOM)
                                                        // .querySelectorAll() method selects all HTML elements matching a CSS selector
                                                        // selector '.cell' means all elements with the class 'cell'

console.log(cells); // log the NodeList of all grid cells; will show how many cells grabbed (should be 300 for 15x20 grid)
                            // prints the value of 'cells' to the browser console
*/