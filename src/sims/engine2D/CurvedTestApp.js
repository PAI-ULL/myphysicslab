// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.sims.engine2D.CurvedTestApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.ThrusterSet');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.SixThrusters');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var NumericControl = lab.controls.NumericControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DisplayList = lab.view.DisplayList;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var GravityLaw = lab.model.GravityLaw;
var ParameterNumber = lab.util.ParameterNumber;
var RigidBody = lab.engine2D.RigidBody;
var Shapes = lab.engine2D.Shapes;
var Spring = lab.model.Spring;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var Walls = lab.engine2D.Walls;

/**  CurvedTestApp shows some ball and rectangle objects bouncing
among some fixed ball and rectangle objects.

This sim has a config() function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.layout.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.CurvedTestApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -6, 8, 6);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.rbo.protoPolygon.setDrawCenterOfMass(true).setNameFont('10pt sans-serif');
  this.rbo.protoSpring.setWidth(0.3);
  this.mySim.setShowForces(true);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new myphysicslab.lab.model.DampingLaw(0, 0.15, this.simList);
  /** @type {!lab.model.GravityLaw} */
  this.gravityLaw = new myphysicslab.lab.model.GravityLaw(3.0, this.simList);
  this.elasticity.setElasticity(0.8);

  /** @type {number} */
  this.numBods = 6;
  /** @type {number} */
  this.thrust = 1.5;
  /** @type {!lab.engine2D.ThrusterSet} */
  this.thrust1;
  /** @type {!lab.engine2D.ThrusterSet} */
  this.thrust2;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, CurvedTestApp.en.NUM_BODIES,
      CurvedTestApp.i18n.NUM_BODIES,
      this.getNumBods, this.setNumBods).setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CurvedTestApp.en.THRUST,
      CurvedTestApp.i18n.THRUST,
      this.getThrust, this.setThrust));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var CurvedTestApp = sims.engine2D.CurvedTestApp;
goog.inherits(CurvedTestApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CurvedTestApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + CurvedTestApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
CurvedTestApp.prototype.getClassName = function() {
  return 'CurvedTestApp';
};

/** @inheritDoc */
CurvedTestApp.prototype.defineNames = function(myName) {
  CurvedTestApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('CurvedTestApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
CurvedTestApp.prototype.getSubjects = function() {
  var subjects = CurvedTestApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
CurvedTestApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  CurvedTestApp.make(this.mySim, this.gravityLaw, this.dampingLaw,
      this.numBods, this.simView.getSimRect(), this.displayList);
  /** @type {!RigidBody} */
  var b;
  if (this.numBods >= 1) {
    b = this.mySim.getBody('block1');
    this.thrust2 = sims.engine2D.SixThrusters.make(this.thrust, b);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.mySim.addForceLaw(this.thrust2);
  }
  if (this.numBods >= 2) {
    b = this.mySim.getBody('ball2');
    this.thrust1 = sims.engine2D.SixThrusters.make(this.thrust, b);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.mySim.addForceLaw(this.thrust1);
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/** Adds a set of circular and rectangular Polygons to the ContactSim.
* @param {!ContactSim} sim the ContactSim to add bodies to
* @param {!GravityLaw} gravity the GravityLaw to connect bodies to
* @param {!DampingLaw} damping the DampingLaw to connect bodies to
* @param {number} numBods number of free moving bodies to make, from 1 to 6.
* @param {!DoubleRect} simRect rectangle for making a set of enclosing
*   walls, in simulation coords.
* @param {?DisplayList} displayList
* @return {undefined}
*/
CurvedTestApp.make = function(sim, gravity, damping, numBods, simRect, displayList) {
  sim.addForceLaw(damping);
  damping.connect(sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.connect(sim.getSimList());
  /** @type {!RigidBody} */
  var b;
  b = Shapes.makeBlock(2.0, 2.0, CurvedTestApp.en.FIX_BLOCK+1,
      CurvedTestApp.i18n.FIX_BLOCK+1);
  b.setMass(UtilityCore.POSITIVE_INFINITY);
  b.setPosition(new Vector(-0.4,  -4.6),  -Math.PI/16);
  sim.addBody(b);
  b = Shapes.makeBall(2, CurvedTestApp.en.FIX_BALL+2,
      CurvedTestApp.i18n.FIX_BALL+2);
  b.setMass(UtilityCore.POSITIVE_INFINITY);
  b.setPosition(new Vector(3,  2.5-4.5-0.1), 0);
  sim.addBody(b);
  b = Shapes.makeBlock(2.0, 2.0, CurvedTestApp.en.FIX_BLOCK+3,
      CurvedTestApp.i18n.FIX_BLOCK+3);
  b.setMass(UtilityCore.POSITIVE_INFINITY);
  b.setPosition(new Vector(-3.4,  -4.6),  Math.PI/16);
  sim.addBody(b);
  b = Shapes.makeBlock(1.5, 4, CurvedTestApp.en.FIX_BLOCK+4,
      CurvedTestApp.i18n.FIX_BLOCK+4);
  b.setMass(UtilityCore.POSITIVE_INFINITY);
  b.setPosition(new Vector(6.7, -1.0), -0.2);
  sim.addBody(b);
  if (numBods >= 1) {
    b = Shapes.makeBlock(0.8, 1.5, CurvedTestApp.en.BLOCK+1,
      CurvedTestApp.i18n.BLOCK+1);
    b.setPosition(new Vector(-2.0,  -2),  0);
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('cyan'); };
  }
  if (numBods >= 2) {
    b = Shapes.makeBall(0.8, CurvedTestApp.en.BALL+2,
        CurvedTestApp.i18n.BALL+2);
    b.setCenterOfMass(b.getLeftBody() + 0.5*b.getWidth(),
        b.getBottomBody() + 0.2*b.getHeight());
    b.setPosition(new Vector(-1.7,  1),  0);
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('orange'); };
  }
  if (numBods >= 3) {
    b = Shapes.makeBall(1, CurvedTestApp.en.BALL+2,
        CurvedTestApp.i18n.BALL+2);
    var x = 0;
    var y = -1 + 2.0;
    x += 1 - 0.5;
    y += 1 - 0.3;
    b.setPosition(new Vector(x, 0.1+y+ sim.getDistanceTol() / 2.0), Math.PI);
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('#9f3'); };
  }
  if (numBods >= 4) {
    b = Shapes.makeBlock(0.8, 2, CurvedTestApp.en.BLOCK+4,
        CurvedTestApp.i18n.BLOCK+4);
    b.setMass(2);
    b.setPosition(new Vector(5, 0), 0.2);
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('#f6c'); };
  }
  if (numBods >= 5) {
    b = Shapes.makeBall(0.4, CurvedTestApp.en.BALL+5,
        CurvedTestApp.i18n.BALL+5);
    b.setMass(1.5);
    b.setPosition(new Vector(5.9, 2));
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('#39f'); };
  }
  if (numBods >= 6) {
    b = Shapes.makeBall(1.0, CurvedTestApp.en.BALL+6,
        CurvedTestApp.i18n.BALL+6);
    b.setMass(1.0);
    b.setPosition(new Vector(-2.5,  4));
    sim.addBody(b);
    if (displayList != null) { displayList.find(b).setFillStyle('#c99'); };
  }
  var zel = Walls.make2(sim, simRect);
  gravity.setZeroEnergyLevel(zel);
};

/**
* @return {number}
*/
CurvedTestApp.prototype.getNumBods = function() {
  return this.numBods;
};

/**
* @param {number} value
*/
CurvedTestApp.prototype.setNumBods = function(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(CurvedTestApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
CurvedTestApp.prototype.getThrust = function() {
  return this.thrust;
};

/**
* @param {number} value
*/
CurvedTestApp.prototype.setThrust = function(value) {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(CurvedTestApp.en.THRUST);
};

/** Set of internationalized strings.
@typedef {{
  NUM_BODIES: string,
  THRUST: string,
  BALL: string,
  BLOCK: string,
  FIX_BALL: string,
  FIX_BLOCK: string
  }}
*/
CurvedTestApp.i18n_strings;

/**
@type {CurvedTestApp.i18n_strings}
*/
CurvedTestApp.en = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  BALL: 'ball',
  BLOCK: 'block',
  FIX_BALL: 'fixed ball',
  FIX_BLOCK: 'fixed block'
};

/**
@private
@type {CurvedTestApp.i18n_strings}
*/
CurvedTestApp.de_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  BALL: 'Ball',
  BLOCK: 'Block',
  FIX_BALL: 'Festball',
  FIX_BLOCK: 'Festblock'
};

/** Set of internationalized strings.
@type {CurvedTestApp.i18n_strings}
*/
CurvedTestApp.i18n = goog.LOCALE === 'de' ? CurvedTestApp.de_strings :
    CurvedTestApp.en;

}); // goog.scope
