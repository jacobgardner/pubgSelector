"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gl_matrix_1 = require("gl-matrix");
const inventory_1 = require("./inventory");
class Player {
    constructor(name) {
        this.name = name;
        this.inventory = new inventory_1.default();
        this.health = 100;
        this.riskiness = Math.random();
        this.targetting = null;
        this.direction = gl_matrix_1.vec3.random(gl_matrix_1.vec3.create());
        this.direction[2] = 0;
        this.position = gl_matrix_1.vec3.fromValues(0, 0, 10000);
    }
}
exports.default = Player;
