var gridColour = "#888888";
var pixelColour = "#FFFFFF";
var bgColour = "#000000";
var pixelSize = 10;
var tickDelay = 200;

var canvas;
var ctx;
var width;
var height;
var cells;
var nextCells;
var isDragging;

//both of these are clockwise, starting from north.
//used to make it possible to iterate through the moore neighbours
var xOffsets = [ 0, 1, 1,1,0,-1,-1,-1];
var yOffsets = [-1,-1, 0,1,1, 1, 0,-1];

//Do one game tick, then render the screen.
function tick(){
	if(shouldTick()){
		//make a copy of the cells to edit.
		//the reason I dont just edit the one array is because conway's is meant to have all the cells ticked at the same time.
		//rather than trying to do that, just making a copy of the array and changing each state based on the previous state keeps it all in sync
		nextCells = cells.map(function(arr) {
			return arr.slice();
		});
		
		for(var x = 0; x < cells.length; x++){
			for(var y = 0; y < cells[0].length; y++){
				tickCell(x, y); //tick all the cells
			}
		}
	
		//copies back. I dont know if it's necessary to use slicing for this, but i'll do it anyway
		cells = nextCells.map(function(arr) {
			return arr.slice();
		});
		draw();
	}
}

//Tick one individual cell, killing it or birthing it based on the cells around it.
function tickCell(x, y){
	var count = getNeighbourCount(x, y);
	var alive = cells[x][y];
	if(count < 2 && alive){
		nextCells[x][y] = false;
	}
	
	if(count > 3 && alive){
		nextCells[x][y] = false;
	}
	
	if(count == 3 && !alive){
		nextCells[x][y] = true;
	}
}

//returns the amount of moore neighbours
function getNeighbourCount(posX, posY){
	var count = 0;
	for(var dir = 0; dir < 8; dir++){
		refX = posX + xOffsets[dir];
		refY = posY + yOffsets[dir];
		if(refX >= 0 && refX < cells.length){
			if(refY >= 0 && refY < cells[0].length){
				if(cells[refX][refY]){
					count = count + 1;
				}
			}
		}
	}
	return count;
}

//returns true if cell is on that director, starting from 0 (north), then rotating clockwise to 7 (north-west)
function cellIsOnSide(x, y, dir){
	var offsetX = xOffsets[dir];
	var offsetY = yOffsets[dir];
	posX = x + offsetX;
	posY = y + offsetY;
	if(posX < 0 || posX >= cells.length || posY < 0 || posY >= cells[0].length){
		return true;
	}
	return cells[posX][posY];
}

//Draws all the cells to the screen.
function draw(){
	ctx.fillStyle = bgColour;
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = pixelColour;
	ctx.beginPath();
	
	for(var x = 0; x < width / pixelSize; x++){
		for(var y = 0; y < height / pixelSize; y++){
			if(cells[x][y]){
				drawCell(x, y);
			}
		}
	}
	
	ctx.closePath();
	ctx.fill();
	
	if(shouldDrawGrid()){
		drawGrid();
	}
}

function drawCell(cellX, cellY){
	var x = cellX*pixelSize;
	var y = cellY*pixelSize;
	var mid = pixelSize / 2;
	var hasNorthSide = cellIsOnSide(cellX, cellY, 0) || !shouldDoRounding();
	var hasEastSide = cellIsOnSide(cellX, cellY, 2) || !shouldDoRounding();
	var hasSouthSide = cellIsOnSide(cellX, cellY, 4) || !shouldDoRounding();
	var hasWestSide = cellIsOnSide(cellX, cellY, 6) || !shouldDoRounding();
	ctx.moveTo(x, y);
	drawCorner(x + mid, y, x + pixelSize, y, x + pixelSize, y + mid, !hasNorthSide && !hasEastSide); //north-east
	drawCorner(x + pixelSize, y + mid, x + pixelSize, y + pixelSize, x + mid, y + pixelSize, !hasSouthSide && !hasEastSide); //south-east
	drawCorner(x + mid, y + pixelSize, x, y + pixelSize, x, y + mid, !hasSouthSide && !hasWestSide); //south-west
	drawCorner(x, y + mid, x, y, x + mid, y, !hasNorthSide && !hasWestSide); //north-west
}

function drawCorner(startX, startY, midX, midY, endX, endY, rounded){
	ctx.lineTo(startX, startY);
	if(rounded){
		ctx.quadraticCurveTo(midX, midY, endX, endY);
	}else{
		ctx.lineTo(midX, midY);
		ctx.lineTo(endX, endY);
	}
}

function drawGrid(){
	ctx.beginPath();
	//columns
	for(var x = 0; x < width / pixelSize; x++){
		ctx.moveTo(x * pixelSize, 0);
		ctx.lineTo(x * pixelSize, height);
	}
	
	//rows
	for(var y = 0; y < height / pixelSize; y++){
		ctx.moveTo(0, y * pixelSize);
		ctx.lineTo(width, y * pixelSize);
	}
	ctx.closePath();
	
	ctx.strokeStyle = gridColour;
	ctx.stroke();
}

//initializes the cells variable, with a default state of all cells dead
function initCells(){
	var cells = [[]];
	for(var x = 0; x < width / pixelSize; x++){
		cells[x] = [];
		for(var y = 0; y < height / pixelSize; y++){
			cells[x][y] = false;
		}
	}
	return cells;
}

//adds a living cell at the cursor's position
function addCellAtCursor(event){
	//cursor position
	var x = event.clientX - canvas.offsetLeft;
	var y = event.clientY - canvas.offsetTop;
	
	//converted to coordinates
	var coordX = Math.floor(x / pixelSize);
	var coordY = Math.floor(y / pixelSize);
	
	if(!cells[coordX][coordY]){
		cells[coordX][coordY] = true;
		draw();
	}
}

function shouldTick(){
	return $("#tick").is(':checked');
}

function shouldDrawGrid(){
	return $("#grid").is(':checked');
}

function shouldDoRounding(){
	return $("#rounding").is(':checked');
}

function addRandomCells(amount){
	for(var i = 0; i < amount; i++){
		var x = Math.floor(Math.random() *  width / pixelSize);
		var y = Math.floor(Math.random() *  height / pixelSize);
		cells[x][y] = true;
	}
	draw();
}

function addButtonListeners(){
	//when we click the clear button..
	$('#clear').click(function(){
		cells = initCells(); //reinit (clear)
		draw();
	});
	
	//when we click the random fill button..
	$('#random').click(function(){
		addRandomCells(((width / pixelSize) * (height / pixelSize)) / 10);//add 10% of the total number of cells as random cells
		draw();
	});
	
	$('#grid').click(draw);
	
	$('#rounding').click(draw);
	
	//enter key is play/pause button
	$(document).on('keydown', function(d){
		if (d.keyCode == 13) {
			var state = $("#tick").is(':checked');
			$("#tick").prop('checked', !state);
		}
	})
}

//initialization method
$(document).ready(function(){
	canvas = document.getElementById('game');
	ctx = canvas.getContext("2d");
	width = canvas.width;
	height = canvas.height;
	cells = initCells();
	
	//pixel draw method
	$(canvas).mousedown(function(event) {
		event.preventDefault();
		isDragging = true;
		addCellAtCursor(event);
	})
	.mousemove(function(event) {
		event.preventDefault();
		if (isDragging) {
			addCellAtCursor(event);
		}
	})
	.mouseup(function() {
		isDragging = false;
	});
	
	addButtonListeners();
	
	//do our first draw cycle so the game isn't blank
	draw();
	
	//repeatedly tick
	setInterval(tick, tickDelay);
});
