
//////////////////////////////////////////////////////////////////////////////
// Global Variables

// view transforms
var OFFSET = 0;
var ZOOM = 1;
var START = 0;

// for calculating drag deltas
var DOWN_Y = 0;
var DELTA_Y = 0;

let FILE = '';
let FRAMES = [];

// modes

var MODE = 'IDLE';

//////////////////////////////////////////////////////////////////////////////
// Setup and Draww

function setup() {
  OFFSET = 0;
  const c = createCanvas(windowWidth,windowHeight);
  background(24);
  c.drop(gotFile); // dropfile event triggers callback

  // init ui elements
  timeline = new Timeline();
}

function draw() {
  background(24);
  timeline.render();
  drawDebug();
  //noLoop();
}

//////////////////////////////////////////////////////////////////////////////
// Events

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function touchStarted() {
  timeline.touched();
  redraw();
}

function touchMoved() {
  timeline.dragged();
  redraw();
  return false;
}

function gotFile(file) {
  FILE = 'You dropped a file! Good Job!';
  redraw();
}

//////////////////////////////////////////////////////////////////////////////
// Timeline

class Timeline {

  touched() {
    MODE = 'PAN';
    START = OFFSET;
    DELTA_Y = mouseY;
    DOWN_Y = mouseY;
    return true;
  }

  dragged() {
    if (MODE != 'PAN') {
      return false;
    }
    DELTA_Y = mouseY - DOWN_Y;
    OFFSET = START + DELTA_Y * ZOOM;
    return true;
  }

  render() {
    for (var i = 0; i < height; i++) {
      if ((toSeconds(i)) % 100 == 0) {
        stroke(50);
        fill(50);
        line(0, i, width, i);
        textSize(12);
        text(str(toSeconds(i)), 10, i);
      }
    }
  }
}

//////////////////////////////////////////////////////////////////////////////
// Models

// frame array: [start, stop, project, uid, tags, edited?]

//////////////////////////////////////////////////////////////////////////////
// Misc

function now() {
  n = new Date() / 1000;
  return n;
}

function toSeconds(pixels) {
  secs = Math.round(-(pixels - height/2) * ZOOM + now() + OFFSET);
  return secs;
}

function toPixels(seconds) {
  px = -((seconds - now() -  OFFSET) / ZOOM) + height/2;
  return px;
}

function drawTimeline() {
  for (var i = 0; i < height; i++) {
    if ((toSeconds(i)) % 100 == 0) {
      stroke(50);
      fill(50);
      line(0, i, width, i);
      textSize(12);
      text(str(toSeconds(i)), 10, i);
    }
  }
}

function drawDebug() {
  // font settings
  fill(255);
  textSize(20);
  noStroke();
  textAlign(RIGHT);
  margin = 10;

  // test dropfile text
  text(FILE, width - margin, height - margin - 25)
  text('offset: ' + str(OFFSET), width - margin, height - margin);

  // draw now marker
  text('<<<<<<< NOW >>>>>>>', width - margin, toPixels(now()));

  textAlign(LEFT);
}

