"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const location_1 = require("./location");
const simulation_1 = require("./simulation");
const faker_1 = require("faker");
const config_1 = require("./config");
const gl_matrix_1 = require("gl-matrix");
// const canvas = document.body.querySelector('canvas');
// if (!canvas) {
//     throw new Error('Was expecting a canvas on the page');
// }
const players = [];
const locations = [];
for (let i = 0; i < 100; i += 1) {
    players.push(faker_1.name.firstName());
    // const p = new Player(name.firstName());
    // players.push(p);
}
for (let i = 0; i < 10; i += 1) {
    const l = new location_1.default();
    l.lootChance = [0.8, 0.5, 0.1];
    l.radius = 1000;
    l.position = gl_matrix_1.vec2.random(gl_matrix_1.vec2.create());
    locations.push(l);
}
const simulation = new simulation_1.default(players, locations);
function simulate() {
    const start = Date.now();
    simulation.simulateStep();
    const stop = Date.now();
    setTimeout(simulate, config_1.TIME_STEP - (stop - start));
}
simulate();
