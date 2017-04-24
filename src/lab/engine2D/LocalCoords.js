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

goog.provide('myphysicslab.lab.engine2D.LocalCoords');

goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var GenericVector = myphysicslab.lab.util.GenericVector;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var NF = myphysicslab.lab.util.UtilityCore.NF;

/** Remembers the local coordinate system of a
* {@link myphysicslab.lab.model.MassObject}. Used during collision checking to
* compare previous and current locations of objects.
* @constructor
* @final
* @struct
*/
myphysicslab.lab.engine2D.LocalCoords = function() {
  /** center of mass in body coordinates
  * @type {!Vector}
  * @protected
  */
  this.cm_body_ = Vector.ORIGIN;
  /**
  * @type {!Vector}
  * @protected
  */
  this.loc_world_ = Vector.ORIGIN;
  /** sine of angle
  * @type {number}
  * @protected
  */
  this.sinAngle_ = 0.0;
  /** cosine of angle.
  * @type {number}
  * @protected
  */
  this.cosAngle_ = 1.0;
};
var LocalCoords = myphysicslab.lab.engine2D.LocalCoords;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  LocalCoords.prototype.toString = function() {
    return 'LocalCoords{'
        +'loc_world_: '+this.loc_world_
        +', cm_body_: '+this.cm_body_
        +', sinAngle_: '+NF(this.sinAngle_)
        +', cosAngle_: '+NF(this.cosAngle_)
        +'}';
  };
};

/** Returns the world coordinates of the given body coordinates point, based on current
position of the object.
@param {!GenericVector} p_body  the point, in body coordinates
@return {!Vector} the point in world coordinates
*/
LocalCoords.prototype.bodyToWorld = function(p_body) {
  var rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  var ry = p_body.getY() - this.cm_body_.getY();
  var vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  var vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** Sets the values that define the local coordinate system.
* @param {!Vector} cm_body center of mass of the object in body coordinates
* @param {!Vector} loc_world location of center of mass in world coordinates
* @param {number} sinAngle sine of angle of rotation about center of mass
* @param {number} cosAngle cosine of angle of rotation about center of mass
*/
LocalCoords.prototype.set = function(cm_body, loc_world, sinAngle, cosAngle) {
  this.cm_body_ = cm_body;
  this.loc_world_ = loc_world;
  this.sinAngle_ = sinAngle;
  this.cosAngle_ = cosAngle;
};

/** Returns the body coordinates of the given world coordinates point, based on current
position of the object.
@param {!GenericVector} p_world  the point, in world coordinates
@return {!Vector} the point in body coordinates
*/
LocalCoords.prototype.worldToBody = function(p_world) {
  // get the vector from cm (which is at x_world,y_world) to p_world
  var rx = p_world.getX() - this.loc_world_.getX();
  var ry = p_world.getY() - this.loc_world_.getY();
  var sin = -this.sinAngle_;
  var cos = this.cosAngle_;
  // add the reverse-rotated vector to the cm location (in body-coords)
  var vx = this.cm_body_.getX() + (rx*cos - ry*sin);
  var vy = this.cm_body_.getY() + (rx*sin + ry*cos);
  return new Vector(vx, vy);
};

}); // goog.scope