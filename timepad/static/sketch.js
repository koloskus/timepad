
//////////////////////////////////////////////////////////////////////////////
// Global Variables

// view transforms
var LAST_OFFSET = 0;
var OFFSET = 0;
var ZOOM = 100;

// for calculating drag deltas
var DOWN_Y = 0;
var DELTA_Y = 0;
var START = 0;

// model
let FRAMES = [];

// ui
var CONTEXT;
let timeline;
var del_btn;
var start_btn;
var now_btn;
var done_btn;


//////////////////////////////////////////////////////////////////////////////
// Setup and Draww

p5.disableFriendlyErrors = true; // disables FES for performance

function setup() {
  frameRate(1);
  reset_offset();
  CONTEXT = 'SCRUB';
  strokeJoin(ROUND);
  strokeCap(ROUND);
  createCanvas(windowWidth,windowHeight);

  del_btn = select('#delete_btn');
  del_btn.mousePressed(delete_btn_callback);
  del_btn.touchStarted(delete_btn_callback);

  start_btn = select('#start_btn');
  start_btn.mousePressed(start_btn_callback);

  now_btn = select('#now_btn');
  now_btn.mousePressed(jumpt_to_now);

  edit_btn = select('#edit_btn');
  edit_btn.mousePressed(edit_btn_callback);

  done_btn = select('#done_edit_btn');
  done_btn.mousePressed(done_edit_callback);

  timeline = new Timeline();

  loadFrames();
}

function draw() {
  OFFSET = LAST_OFFSET + now();
  background(24);
  drawSky();
  drawTimeline();
  for (f in FRAMES) {
    frame = FRAMES[f];
    if (frame.recording == true) {
      frame.stop = OFFSET;
    }
    drawFrame(frame);
  }
  drawCrosshair();
  drawDebug();
  for (let touch of touches) {
    ellipse(touch.x, touch.y, 100);
  }
  //noLoop();
}

//////////////////////////////////////////////////////////////////////////////
// Button Callbacks

function start_btn_callback() {
  CONTEXT = 'BTN_PRESSED';
  startFrame();
  start_btn.html('Stop')
  start_btn.style('background', 'red');
  start_btn.mousePressed(stop_btn_callback);
}

function stop_btn_callback() {
  CONTEXT = 'BTN_PRESSED';
  stopFrame();
  start_btn.html('Start')
  start_btn.style('background', 'none');
  start_btn.mousePressed(start_btn_callback);
}

function jumpt_to_now() {
  CONTEXT = 'BTN_PRESSED';
  reset_offset();
  redraw();
}

function edit_btn_callback() {
  CONTEXT = 'EDITING';
  var form = select('#edit_frame_form');
  //form.center();
  form.style('display', 'flex');
}

function done_edit_callback() {
  CONTEXT = 'SCRUB';
  var form = select('#edit_frame_form');
  form.hide();
}

function delete_btn_callback() {
  CONTEXT = 'BTN_PRESSED';
  deleteFrame();
}

//////////////////////////////////////////////////////////////////////////////
// p5 Events

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function touchStarted() {
  if (CONTEXT != 'SCRUB') {
    return;
  } else {
    framesTouch();
    timeline.touched();
    redraw();
  }
}

function touchEnded() {
  CONTEXT = 'SCRUB';
}

function touchMoved() {
  if (CONTEXT == 'BTN_PRESSED') {
    return false;
  } else {
    timeline.dragged();
    redraw();
    return false;
  }
}

function mouseWheel(event) {
  //console.log(ZOOM);
  var dampening = 1 / (1000 / ZOOM);
  ZOOM = constrain(ZOOM + event.delta * dampening, 10, 1000);
  redraw();
  //return false;
}

//////////////////////////////////////////////////////////////////////////////
// Timeline

class Timeline {

  touched() {
    START = OFFSET;
    DELTA_Y = mouseY;
    DOWN_Y = mouseY;
  }

  dragged() {
    DELTA_Y = mouseY - DOWN_Y;
    OFFSET = START + DELTA_Y * ZOOM;
    LAST_OFFSET = OFFSET - now();
  }
}

//////////////////////////////////////////////////////////////////////////////
// Frame Controls

// frame array: [start, stop, project, uid, tags, edited?]

class Frame {
  constructor(start) {
    this.start = start;
    this.stop = start + 100;
    this.project = 'project';
    this.selected = true;
    this.recording = false;
  }
}

/** Returns true if the mouse is over the given frame. */
function overFrame(frame) {
  var x = mouseX;
  var y = mouseY;
  var x1 = width/4;
  var x2 = width - width/4;
  var y1 = toPixels(frame.stop);
  var y2 = toPixels(frame.start);

  if (x1 < x && x < x2 && y1 < y && y < y2) {
    return true;
  } else {
    return false;
  }
}

/** Loop through frames and remove those that are selected. */
function deleteFrame() {
  for (f in FRAMES) {
    if (FRAMES[f].selected == true) {
      FRAMES.splice(f, 1);
    }
  }
  sync();
}

function startFrame() {
  deselectFrames();
  new_frame = new Frame(toSeconds(height / 2));
  new_frame.recording = true;
  FRAMES.push(new_frame);
}

function stopFrame() {
  deselectFrames();
  for (f in FRAMES) {
    frame = FRAMES[f];
    if (frame.recording == true) {
      if (frame.stop - frame.start < 60) {
        FRAMES.splice(f, 1);
      } else {
      frame.recording = false;
    }
    }
  }
  sync();
}

function deselectFrames() {
  for (f in FRAMES) {
    FRAMES[f].selected = false;
  }
}

/** Leave only the frame that's directly under the cursor selected. */
function framesTouch() {
  for (f in FRAMES) {
    FRAMES[f].selected = false;
  }
  // reverse loop so the top ones are seleced first
  for (var i = FRAMES.length; i--;) {
    var frame = FRAMES[i];
    if (overFrame(frame)) {
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
