import { vec2, vec3 } from 'gl-matrix';
import { PLANE_ALTITUDE } from './config'
import Inventory from './inventory';

export default class Player {
    position: vec3;
    direction: vec3;
    inventory: Inventory = new Inventory();
    health: number = 100;
    riskiness: number = Math.random();
    targetting: Player | null = null;

    constructor(public name: string) {
        this.direction = vec3.random(vec3.create());
        this.direction[2] = 0;

        this.position = vec3.fromValues(0, 0, 10000);

    }
}
