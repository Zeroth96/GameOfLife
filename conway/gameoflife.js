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
var isDragging;
var nextCells;

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
		draw(cells);
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

//Draws all the cells to the screen.
function draw(cells){
	for(var x = 0; x < width / pixelSize; x++){
		for(var y = 0; y < height / pixelSize; y++){
			var style = bgColour; //dead style
			if(cells[x][y]){
				style = pixelColour; //alive style
			}
			ctx.fillStyle = style;
			ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
		}
	}
	
	if(shouldDrawGrid()){
		drawGrid();
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

//adds a living cell at the cursor's position
function addCellAtCursor(event){
	//cursor position
	var x = event.clientX - canvas.offsetLeft;
	var y = event.clientY - canvas.offsetTop;
	
	//converted to coordinates
	var coordX = Math.floor(x / pixelSize);
	var coordY = Math.floor(y / pixelSize);
	
	cells[coordX][coordY] = true;
	draw(cells);
}

function shouldTick(){
	return $("#tick").is(':checked');
}

function shouldDrawGrid(){
	return $("#grid").is(':checked');
}

function addRandomCells(amount){
	for(var i = 0; i < amount; i++){
		var x = Math.floor(Math.random() *  width / pixelSize);
		var y = Math.floor(Math.random() *  height / pixelSize);
		cells[x][y] = true;
	}
	draw(cells);
}

function addButtonListeners(){
	//when we click the clear button..
	$('#clear').click(function(){
		cells = initCells(); //reinit (clear)
		draw(cells);
	});
	
	//when we click the random fill button..
	$('#random').click(function(){
		addRandomCells(((width / pixelSize) * (height / pixelSize)) / 10);//add 10% of the total number of cells as random cells
		draw(cells);
	});
	
	//when we toggle the grid checkbox..
	$('#grid').click(function(){
		draw(cells);
	});
	
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
		isDragging = true;
		addCellAtCursor(event);
	})
	.mousemove(function(event) {
		if (isDragging) {
			addCellAtCursor(event);
		}
	})
	.mouseup(function() {
		isDragging = false;
	});
	
	addButtonListeners();
	
	//do our first draw cycle so the game isn't blank
	draw(cells);
	
	//repeatedly tick
	setInterval(tick, tickDelay);
});
