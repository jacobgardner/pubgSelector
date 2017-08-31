import Player from './player';
import Location from './location';
import Simulation from './simulation';
import { name } from 'faker';

import { TIME_STEP } from './config';

import { vec2 } from 'gl-matrix';

// const canvas = document.body.querySelector('canvas');

// if (!canvas) {
//     throw new Error('Was expecting a canvas on the page');
// }

const players = [];
const locations = [];

for (let i = 0; i < 100; i += 1) {
    players.push(name.firstName());
    // const p = new Player(name.firstName());
    // players.push(p);
}

for (let i = 0; i < 10; i += 1) {
    const l = new Location();
    l.lootChance = [0.8, 0.5, 0.1];
    l.radius = 1000;
    l.position = vec2.random(vec2.create());
    locations.push(l);
}

const simulation = new Simulation(players, locations);

function simulate() {
    const start = Date.now();

    simulation.simulateStep();

    const stop = Date.now();

    setTimeout(simulate, TIME_STEP - (stop - start));
}

simulate();
