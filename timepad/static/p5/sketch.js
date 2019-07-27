
//////////////////////////////////////////////////////////////////////////////
// Global Variables
let model;

let settings;
let sky;
let timeline;
let frameset;
let crosshair;
let now_marker;
let elapsed_time;

let mainscreen;

let start_btn;
let stop_btn;
let now_btn;
let edit_btn;
let delete_btn;
let settings_btn;

let background_input;
let fill_input;
let stroke_input;
let active_input;
let sky_checkbox;

//////////////////////////////////////////////////////////////////////////////
// Setup

p5.disableFriendlyErrors = true; // disables FES for performance

function setup() {
  frameRate(1);
  createCanvas(windowWidth,windowHeight);

  model = new Model();
  loadFrames();

  // ui elements
  sky = new Sky(model);
  timeline = new Timeline(model);
  frameset = new Frameset(model);
  crosshair = new Crosshair(model);
  now_marker = new NowMarker(model);
  elapsed_time = new ElapsedTime(model);

  mainscreen = [
    sky,
    timeline,
    frameset,
    crosshair,
    now_marker,
    elapsed_time
  ];

  define_the_buttons(model);
  style_the_dom(model);
}

//////////////////////////////////////////////////////////////////////////////
// Draw

function draw() {
  model.update()
  background(model.style.background_color);

  if (model.context == 'mainscreen') {
    for (let element of mainscreen) {
      element.render();
    }
  }
}

//////////////////////////////////////////////////////////////////////////////
// p5 Events

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function touchStarted(event) {
  if (event.target.id != 'defaultCanvas0') {
    return;
  }
  if (model.context == 'mainscreen') {
    timeline.touched();
    frameset.touched();
  }
  redraw();
  return false;
}

function touchEnded() {
  redraw();
}

function touchMoved(event) {
  if (event.target.id != 'defaultCanvas0') {
    return;
  }
  if (model.context == 'mainscreen') {
    timeline.dragged();
  }
  redraw();
  return false;
}

function mouseWheel(event) {
  if (model.context == 'mainscreen') {
    var dampening = 1 / (1000 / model.zoom);
    model.zoom = constrain(model.zoom + event.delta * dampening, 10, 1000);
    redraw();
  }
}

//////////////////////////////////////////////////////////////////////////////
// http

function loadFrames() {
  httpGet('data/frames', function(response) {
    var json_response = JSON.parse(str(response));
    model.loadFrames(json_response);
    redraw();
  });
}
