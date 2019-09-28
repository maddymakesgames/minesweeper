"use strict"
const tileImage = document.getElementById('tile');
const bombImage = document.getElementById('bomb');
const flagImage = document.getElementById('flag');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let game = false;
let bombs = [];
let revealed = [];
let currentDims = [30, 30]
let bombCount = 90;
const bgColor = '#343434'
let gameOver = false;
let xPixels;
let yPixels;

let timer = false;
let startTime = 0;

let gameRect = [window.innerWidth / 32, (window.innerHeight / 8) / 2, window.innerWidth / 1.5, (window.innerHeight / 8) * 7];
let optionsRect = [2 * (window.innerWidth / 32) + window.innerWidth / 1.5, (window.innerHeight / 8) / 2, window.innerWidth / 4, (window.innerHeight / 8) * 7];
let scaleRect = [optionsRect[0] + (optionsRect[2] / 32), optionsRect[1] + (optionsRect[3] / 12), (optionsRect[2] / 32) * 30, optionsRect[3] / 8];

(() => {
	document.body.appendChild(canvas);
	startGame();
	updateSize();
})()

function startGame() {
	for (let i = 0; i < currentDims[1]; i++) {
		revealed[i] = []
	}
}

function updateSize() {
	gameRect = [window.innerWidth / 32, (window.innerHeight / 8) / 2, window.innerWidth / 1.5, (window.innerHeight / 8) * 7];
	xPixels = gameRect[2] / currentDims[0];
	yPixels = gameRect[3] / currentDims[1];
	optionsRect = [2 * (window.innerWidth / 32) + window.innerWidth / 1.5, (window.innerHeight / 8) / 2, window.innerWidth / 4, (window.innerHeight / 8) * 7];
	scaleRect = [optionsRect[0] + (optionsRect[2] / 32), optionsRect[1] + (optionsRect[3] / 12), (optionsRect[2] / 32) * 30, optionsRect[3] / 8];
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	ctx.fillStyle = '#ccbaff'
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = bgColor
	ctx.fillRect(...gameRect);
	requestAnimationFrame(drawBoard);
	requestAnimationFrame(drawOptions);
}

function drawBoard() {
	for (let i = 0; i < currentDims[1]; i++) {
		for (let e = 0; e < currentDims[0]; e++) {
			if (!revealed[i][e]) ctx.drawImage(tileImage, (xPixels * e) + gameRect[0], (i * yPixels) + gameRect[1], xPixels, yPixels);
			else if (revealed[i][e] == 'flag') {
				ctx.drawImage(tileImage, (xPixels * e) + gameRect[0], (i * yPixels) + gameRect[1], xPixels, yPixels);
				ctx.drawImage(flagImage, (xPixels * e) + gameRect[0], (i * yPixels) + gameRect[1], xPixels, yPixels);
			} else {
				if (game[i][e] == 'bomb') {
					ctx.drawImage(bombImage, (xPixels * e) + gameRect[0], (i * yPixels) + gameRect[1], xPixels, yPixels);
				} else if (game[i][e] != 0) {
					ctx.font = `${xPixels*0.75}px Comic Sans`;
					ctx.fillStyle = '#00FFFF';
					ctx.fillText(game[i][e], (xPixels * e) + gameRect[0] + xPixels * 0.25, ((i + 1) * yPixels) + gameRect[1] + yPixels * -0.05);
				}
			}
		}
	}
}

window.onresize = updateSize;

/**
 * @param {MouseEvent} event
 */
canvas.onclick = (event) => {
	if (gameOver) {
		game = false;
		startGame();
		updateSize();
		gameOver = false;
		return;
	}
	let rawMouseX = event.clientX;
	let rawMouseY = event.clientY;

	if (rawMouseX - gameRect[0] <= gameRect[2] && rawMouseX - gameRect[0] > 0 && rawMouseY - gameRect[1] < gameRect[3] && rawMouseY - gameRect[1] > 0) {
		if(!game) {
			game = gameGen(currentDims, bombCount);
			bombs = game[1];
			game = game[0];
		}
		let mouseGridX = Math.floor((rawMouseX - gameRect[0]) / xPixels);
		let mouseGridY = Math.floor((rawMouseY - gameRect[1]) / yPixels);
		if(!timer) {
			timer = true;
			startTimer();
		}
		if (!revealed[mouseGridY][mouseGridX]) reveal(mouseGridX, mouseGridY);
	} else if (rawMouseX - optionsRect[0] <= optionsRect[2] && rawMouseX - optionsRect[0] > 0 && rawMouseY - optionsRect[1] < optionsRect[3] && rawMouseY - optionsRect[1] > 0) optionsClick(rawMouseX, rawMouseY);
}

/**
 * @param {MouseEvent} event
 */
canvas.oncontextmenu = (event) => {
	event.preventDefault();

	if (gameOver) {
		startGame();
		updateSize();
		gameOver = false;
		return;
	}
	let rawMouseX = event.clientX;
	let rawMouseY = event.clientY;

	let offsettedMouseX = rawMouseX - gameRect[0];
	let offsettedMouseY = rawMouseY - gameRect[1];

	if (offsettedMouseX <= gameRect[2] && offsettedMouseX > 0 && offsettedMouseY < gameRect[3] && offsettedMouseY > 0) {
		let mouseGridX = Math.floor(offsettedMouseX / xPixels);
		let mouseGridY = Math.floor(offsettedMouseY / yPixels);

		if (!revealed[mouseGridY][mouseGridX] || revealed[mouseGridY][mouseGridX] == 'flag') flag(mouseGridX, mouseGridY);
	}
}

function reveal(x, y) {
	revealed[y][x] = true;
	ctx.fillStyle = bgColor
	ctx.fillRect(...gameRect);
	if (game[y][x] == 0) recursiveExpand(x, y);
	drawBoard();
	if (checkIfWin()) {
		ctx.fillStyle = '#00FF00'
		ctx.font = `${(gameRect[2] / 30)*1.75}px Comic Sans`;
		drawStroked("You Win!!!", gameRect[0] + gameRect[2]/2.4, gameRect[1] + gameRect[3]/2.4, '#00FF00');
		gameOver = true;
		timer = false;
	}
	if (checkIfLose()) {
		ctx.fillStyle = '#FF0000'
		ctx.font = `${(gameRect[3] / 30)*1.75}px Comic Sans`;
		drawStroked("You Lose :(", gameRect[0] + gameRect[2]/2.4, gameRect[1] + gameRect[3]/2.4, '#FF0000');

		for (let i = 0; i < bombs.length; i++) {
			const bomb = bombs[i];
			if (revealed[bomb[1]][bomb[0]] != 'flag') revealed[bomb[1]][bomb[0]] = true;
		}

		gameOver = true;
		timer = false;
	}
}

function flag(x, y) {
	if (revealed[y][x] == 'flag') revealed[y][x] = false;
	else revealed[y][x] = 'flag'
	requestAnimationFrame(drawBoard)
}

function recursiveExpand(x, y) {
	for (let i = 0; i < 9; i++) {
		let relX = ((i % 3) - 1 + x);
		let relY = (Math.floor(i / 3) - 1 + y);
		if (relX < 0 || relY < 0 || relX > game[0].length - 1 || relY > game.length - 1) continue;
		if (!revealed[relY][relX] && revealed[relY][relX] != 'flag') {
			revealed[relY][relX] = true;
			if (game[relY][relX] == 0) recursiveExpand(relX, relY);
		}
	}
}

function checkIfLose() {
	for (let i = 0; i < bombs.length; i++) {
		const bomb = bombs[i];
		if (revealed[bomb[1]][bomb[0]] && revealed[bomb[1]][bomb[0]] != 'flag') return true;
	}
}

function checkIfWin() {
	for (let y = 0; y < revealed.length; y++) {
		for (let x = 0; x < revealed[y].length; x++) {
			let bombTile;
			for (let i = 0; i < bombs.length; i++) {
				const bomb = bombs[i];
				if (bomb[0] == x && bomb[1] == y) bombTile = true;
			}
			if (!revealed[y][x] && !bombTile) return false;
		}
	}
	return true;
}


function gameGen(size, b) {
	const game = [];
	for (let y = 0; y < size[1]; y++) {
		game[y] = [];
		for (let x = 0; x < size[0]; x++) {
			game[y][x] = 0;
		}
	}
	let bombs = [];
	for (let i = 0; i < b; i++) {
		let bx = Math.floor(Math.random() * size[0]);
		let by = Math.floor(Math.random() * size[1]);
		if (bx >= 0 && bx < size[0] && by >= 0 && by < size[1] && game[by][bx] != 'bomb') {
			game[by][bx] = 'bomb'
			bombs.push([bx, by]);
			for (let e = 0; e < 9; e++) {
				let cx = ((e % 3) - 1 + bx);
				let cy = Math.floor(e / 3) - 1 + by;
				if (cx < 0 || cx >= size[0] || cy < 0 || cy >= size[1]) continue;
				if (game[cy][cx] != 'bomb') game[cy][cx]++;
			}
		} else i--;
	}
	return [game, bombs];
}

function drawOptions() {
	ctx.fillStyle = '#c6c6c6';
	ctx.fillRect(...optionsRect);
	ctx.fillStyle = '#664557'
	ctx.font = `${((optionsRect[2] / 32)*30)/13}px Comic Sans`;
	ctx.fillText('Game Options', optionsRect[0] + ((optionsRect[2] / 2) - (scaleRect[2]) / 3.5), (optionsRect[1] + optionsRect[3] / 18));

	ctx.fillStyle = '#000000';
	let xTextSize = optionsRect[2]/10;
	ctx.font = `${xTextSize}px Comic Sans`;
	ctx.fillText('Timer', (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3.25) - (10 * xTextSize) / 9, scaleRect[1] + scaleRect[3] * (0.6 + 5.75));
	ctx.fillText(`00:00.000`, (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3.25) - (10 * xTextSize) / 5, scaleRect[1] + scaleRect[3] * (0.6 + 6.5));

	let labels = ['Width', 'Height', 'Bomb Count'];

	for (let rectNum = 0; rectNum < 3; rectNum++) {
		ctx.fillStyle = '#67d501';
		ctx.fillRect(scaleRect[0], scaleRect[1] + scaleRect[3] * ((rectNum * 1.6) + 1), scaleRect[2], scaleRect[3]);

		for (let i = 0; i < 3; i++) {
			ctx.fillStyle = '#000000';
			ctx.rect(scaleRect[0] + ((scaleRect[2]) / 3) * i, scaleRect[1] + (scaleRect[3]) * ((rectNum * 1.6) + 1), (scaleRect[2]) / 3, scaleRect[3]);

		}
		ctx.stroke();

		ctx.font = `${((optionsRect[2] / 32)*30)/12}px Comic Sans`;
		ctx.fillText('-', (scaleRect[0]) * 1.04, scaleRect[1] + scaleRect[3] * (0.6 + (rectNum * 1.6) + 1));
		ctx.fillText('+', (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3) * 2, scaleRect[1] + scaleRect[3] * (0.6 + (rectNum * 1.6) + 1));

		let textToDisplay = rectNum==2 ? bombCount : currentDims[rectNum];
		xTextSize = (gameRect[3] / 30)*1.5;
		ctx.font = `${xTextSize}px Comic Sans`;
		ctx.fillText(textToDisplay, (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3) - (textToDisplay.toString().length * xTextSize) / 5, scaleRect[1] + scaleRect[3] * (0.6 + (rectNum * 1.6) + 1));
		ctx.fillText(labels[rectNum], (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3.25) - (labels[rectNum].toString().length * xTextSize) / 5, scaleRect[1] + scaleRect[3] * (0.6 + (rectNum * 1.7)));
	}
}

function optionsClick(x, y) {
	let updateSizeWidth = ((scaleRect[2]) / 3);
	if (x - scaleRect[0] > 0 && x - scaleRect[0] < updateSizeWidth && y - scaleRect[1] - scaleRect[3] < scaleRect[3] && y - scaleRect[1] - scaleRect[3] > 0) updateBoardDims(-1, 0);
	if (x - scaleRect[0] - (updateSizeWidth * 2) > 0 && x - scaleRect[0] - (updateSizeWidth * 2) < updateSizeWidth && y - scaleRect[1] - scaleRect[3] < scaleRect[3] && y - scaleRect[1] - scaleRect[3] > 0) updateBoardDims(1, 0);

	if (x - scaleRect[0] > 0 && x - scaleRect[0] < updateSizeWidth && y - scaleRect[1] - (scaleRect[3] * 2.6) < scaleRect[3] && y - scaleRect[1] - (scaleRect[3] * 2.6) > 0) updateBoardDims(0, -1);
	if (x - scaleRect[0] - (updateSizeWidth * 2) > 0 && x - scaleRect[0] - (updateSizeWidth * 3) < updateSizeWidth && y - scaleRect[1] - (scaleRect[3] * 2.6) < scaleRect[3] && y - scaleRect[1] - (scaleRect[3] * 2.6) > 0) updateBoardDims(0, 1);

	if (x - scaleRect[0] > 0 && x - scaleRect[0] < updateSizeWidth && y - scaleRect[1] - (scaleRect[3] * 4.2) < scaleRect[3] && y - scaleRect[1] - (scaleRect[3] * 4.2) > 0) updateBombCount(-1);
	if (x - scaleRect[0] - (updateSizeWidth * 2) > 0 && x - scaleRect[0] - (updateSizeWidth * 3) < updateSizeWidth && y - scaleRect[1] - (scaleRect[3] * 4.2) < scaleRect[3] && y - scaleRect[1] - (scaleRect[3] * 4.2) > 0) updateBombCount(1);
}

function updateBoardDims(x, y) {
	currentDims[0] += x;
	currentDims[1] += y;
	timer = false;
	if(bombCount > (currentDims[0]*currentDims[1])/6) while(bombCount > (currentDims[0]*currentDims[1])/6) {bombCount--;}
	for (let i = 0; i < currentDims[1]; i++) {
		revealed[i] = []
	}
	updateSize();
}

function updateBombCount(num) {
	bombCount += num;

	if(bombCount > (currentDims[0]*currentDims[1])/6) while(bombCount > (currentDims[0]*currentDims[1])/6) {bombCount--;}
	for (let i = 0; i < currentDims[1]; i++) {
		revealed[i] = []
	}
	updateSize();
}

function startTimer() {
	startTime = performance.now().toPrecision(4);
	drawTimer();
	
}

function drawTimer() {
	let currentMill = performance.now() - startTime;

	let minutes = ('0' + Math.floor(currentMill/60000)).slice(-2);
	let seconds = ('0' + Math.floor((currentMill%60000)/1000)).slice(-2);
	let milliseconds = ('0' + Math.floor(((currentMill%60000)%1000))).slice(-3);

	let xTextSize = optionsRect[2]/10;

	ctx.fillStyle = '#c6c6c6';
	ctx.fillRect((scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3.25) - (10 * xTextSize) / 4.5, scaleRect[1] + scaleRect[3] * 6.5, xTextSize*7, scaleRect[3]-60);

	ctx.fillStyle = '#000000';
	ctx.font = `${xTextSize}px Comic Sans`;
	ctx.fillText(`${minutes}:${seconds}.${milliseconds}`, (scaleRect[0]) * 1.04 + ((scaleRect[2]) / 3.25) - (10 * xTextSize) / 4.5, scaleRect[1] + scaleRect[3] * (0.6 + 6.5));
	if(timer) setTimeout(requestAnimationFrame(drawTimer), 10);
}

function drawStroked(text, x, y, color) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.lineJoin="miter";
	ctx.miterLimit=2;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}