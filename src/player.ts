import { vec2, vec3 } from "gl-matrix";
import { PLANE_ALTITUDE } from "./config";
import Inventory from "./inventory";

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

    draw(context: CanvasRenderingContext2D) {
        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 20;
        context.strokeRect(this.position[0] - 200, this.position[1] - 40, 400, 20);

        context.fillStyle = '#FF0000';
        context.fillRect(this.position[0] - 200, this.position[1] - 40, 400 * this.health / 100, 20);

        context.fillStyle = "#FFFFFF";
        context.font = '110px sans-serif';
        context.textAlign = 'center';

        context.fillText(this.name, this.position[0], this.position[1] - 80)
        context.beginPath();;
        context.ellipse(
            this.position[0],
            this.position[1],
            25,
            25,
            0,
            0,
            2 * Math.PI
        );
        context.fill();
    }
}
