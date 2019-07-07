
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
var MODE = 'PAN';

let add_frame_button;
let delete_frame_button;

let BUTTON_PRESSED = false;


//////////////////////////////////////////////////////////////////////////////
// Setup and Draww

function setup() {
  OFFSET = now();
  background(24);
  const c = createCanvas(windowWidth,windowHeight);

  // delet frame button
  delete_frame_button = createButton('Delete Frame');
  delete_frame_button.style('color', 'red')
  delete_frame_button.position(10, 45);
  delete_frame_button.touchStarted(deleteFrame);
  delete_frame_button.mousePressed(deleteFrame);
  delete_frame_button.addClass('button')
  
  // add frame button
  add_frame_button = createButton('Add Frame');
  add_frame_button.position(10, 100);
  add_frame_button.touchStarted(createFrame);
  add_frame_button.mousePressed(createFrame);
  add_frame_button.addClass('button')

  c.drop(gotFile); // dropfile event triggers callback

  // init ui elements
  timeline = new Timeline();

  RES = 'Response';
  loadFrames();
}

function draw() {
  background(24);
  timeline.render();
  for (f in FRAMES) {
    FRAMES[f].render();
  }
  drawCrosshair();
  drawDebug();
  noLoop();
}

//////////////////////////////////////////////////////////////////////////////
// Events

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function touchStarted() {
  if (BUTTON_PRESSED == true) {
    BUTTON_PRESSED = false;
  } else {
    framesTouch();
    timeline.touched();
    redraw();
  }
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
    if (MODE != 'PAN') {
      return false;
    }
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
// Frame

// frame array: [start, stop, project, uid, tags, edited?]

class Frame {
  constructor(start) {
    this.start = start;
    this.stop = start + 100;
    this.project = 'project';
    this.selected = true;
  }

  over() {
    var x = mouseX;
    var y = mouseY;
    var x1 = 50;
    var x2 = width - 50;
    var y1 = toPixels(this.stop);
    var y2 = toPixels(this.start);

    if (x1 < x && x < x2 && y1 < y && y < y2) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    // frame rect
    rectMode(CORNERS);
    stroke(0, 0 , 255);
    if (this.selected == true) {
      stroke(255);
    }
    fill(0,0,100);
    rect(50, toPixels(this.stop), width - 50, toPixels(this.start), 10);

    // frame info
    noStroke();
    fill(255);
    text(this.project, 60, toPixels(this.start)-10)
  }
}

function deleteFrame() {
  BUTTON_PRESSED = true;
  for (f in FRAMES) {
    if (FRAMES[f].selected == true) {
      FRAMES.splice(f, 1);
    }
  }
  httpPost('/data/frames', JSON.stringify(FRAMES), function(result) {
    redraw();
  });
}

function createFrame() {
  BUTTON_PRESSED = true;
  for (f in FRAMES) {
    FRAMES[f].selected = false;
  }
  new_frame = new Frame(toSeconds(height / 2));
  FRAMES.push(new_frame);
  httpPost('/data/frames', JSON.stringify(FRAMES), function(result) {
    redraw();
  });
}

function framesTouch() {
  for (f in FRAMES) {
    FRAMES[f].selected = false;
  }
  // reverse loop so the top ones are seleced first
  for (var i = FRAMES.length; i--;) {
    var frame = FRAMES[i];
    if (frame.over()) {
      frame.selected = true;
      return true;
    }
  }
}

function loadFrames() {
  httpGet('data/frames', function(response) {
    json_response = JSON.parse(str(response));
    FRAMES = [];
    for (j in json_response) {
      new_frame = new Frame(json_response[j].start);
      new_frame.stop = json_response[j].stop;
      new_frame.project = json_response[j].project;
      new_frame.selected = false;
      FRAMES.push(new_frame);
    }
    redraw();
  });
}


//////////////////////////////////////////////////////////////////////////////
// Helpful Utilities

function now() {
  n = new Date() / 1000;
  return n;
}

function toSeconds(pixels) {
  secs = Math.round(-(pixels - height/2) * ZOOM + OFFSET);
  return secs;
}

function toPixels(seconds) {
  px = -((seconds - OFFSET) / ZOOM) + height/2;
  return px;
}

//////////////////////////////////////////////////////////////////////////////
// Debug Info

function drawCrosshair() {
  var size = 15;
  stroke(255);
  var mid = height/2;
  line(width/2 - size, mid, width/2 + size, mid);
  mid = width/2;
  line(mid, height/2 - size, mid, height/2 + size);
}

function drawDebug() {
  // font settings
  fill(255);
  textSize(16);
  noStroke();
  textAlign(RIGHT);
  margin = 10;

  // test dropfile text
  text(FILE, width - margin, height - margin - 25);
  text('offset: ' + str(OFFSET), width - margin, height - margin);

  // draw now marker
  text('<< NOW', width - margin, toPixels(now()));

  textAlign(LEFT);

}

