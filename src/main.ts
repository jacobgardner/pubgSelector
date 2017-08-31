import Player from './player';
import Location from './location';
import Simulation from './simulation';
import { name } from 'faker';

import { TIME_STEP, PLANE_ALTITUDE } from './config';

import { vec2 } from 'gl-matrix';

const canvas = document.body.querySelector('canvas') as HTMLCanvasElement;

if (!canvas) {
    throw new Error('Was expecting a canvas on the page');
}

const context = canvas.getContext('2d') as CanvasRenderingContext2D;

if (!context) {
    throw new Error('Was expecting a context');
}

const details = document.createElement('img');
details.src = 'assets/images/details.jpg';

const topo = document.createElement('img');
topo.src = 'assets/images/topo.jpg';

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

window.addEventListener('resize', resize);

resize();

const players: string[] = [];
const locations: Location[] = [];

for (let i = 0; i < 10; i += 1) {
    const l = new Location();
    l.lootChance = [0.8, 0.5, 0.1];
    l.radius = 1000;
    l.position = vec2.random(vec2.create());
    locations.push(l);
}

const topoP = new Promise((resolve, reject) => {
    topo.addEventListener('load', () => {
        resolve(topo);
    });
});

const detailsP = new Promise((resolve, reject) => {
    details.addEventListener('load', () => {
        resolve(details);
    });
});

function start() {
    const simulation = new Simulation(players, locations);

    function drawSimulation() {
        context.setTransform(
            canvas.width / 8000,
            0,
            0,
            canvas.height / 8000,
            canvas.width / 2,
            canvas.height / 2
        );
        context.drawImage(details, -4000, -4000, 8000, 8000);

        simulation.draw(context);

        window.requestAnimationFrame(drawSimulation);
    }

    drawSimulation();

    function simulate() {
        const start = Date.now();

        simulation.simulateStep();

        const stop = Date.now();

        setTimeout(simulate, TIME_STEP - (stop - start));
    }

    simulate();
}

const button = document.querySelector('button') as HTMLButtonElement;
const textarea = document.querySelector('textarea') as HTMLTextAreaElement;

Promise.all([topoP, detailsP]).then(([topo, details]) => {
    button.addEventListener('click', () => {
        button.style.display = 'none';
        textarea.style.display = 'none';
        canvas.style.opacity = '1';

        const names = textarea.value.split('\n');

        for (const name of names) {
            players.push(name);
        }

        start();
    });
});


