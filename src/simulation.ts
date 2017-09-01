import Player from './player';
import Location from './location';

import { vec2, vec3 } from 'gl-matrix';
import {
    INITIAL_CIRCLE,
    PLANE_ALTITUDE,
    TIME_STEP,
    VISIBLE_AOE,
    BASE_HIT_CHANCE,
    JUMP_CHANCE,
    DIRECTION_ADJUST_FACTOR,
    DIRECTION_VARIANCE
} from './config';

const CIRCLE_RADII = [7000, 3500, 2500, 1800, 900, 500, 100, 60];
const CIRCLE_DELAY = [8, 7, 6, 5, 4, 3, 10];

const SPEEDS = {
    WALKING: 300 / 60,
    SKYDIVING: 400 / 60,
    FALLING: 50,
    PLANE: 500 / 60,
    CIRCLE: 3
};

interface Item {
    itemName: string;
    value: number;
}

function shuffle<T>(list: T[]) {
    for (let i = 0; i < list.length; i += 1) {
        const shufflePos = Math.floor(Math.random() * list.length);

        const temp = list[shufflePos];
        list[shufflePos] = list[i];
        list[i] = temp;
    }
}

// Weapon/scope are negative because it's easier to check to see which is better if lower is always better
const ITEM_LEVELS: Item[][] = [
    [
        {
            itemName: 'head',
            value: 0.8
        },
        {
            itemName: 'body',
            value: 0.55
        },
        {
            itemName: 'weapon',
            value: 0 - 35
        },
        {
            itemName: 'scope',
            value: 0 - 1.2
        }
    ],
    [
        {
            itemName: 'head',
            value: 0.7
        },
        {
            itemName: 'body',
            value: 0.45
        },
        {
            itemName: 'weapon',
            value: 0 - 65
        },
        {
            itemName: 'scope',
            value: 0 - 1.5
        }
    ],
    [
        {
            itemName: 'head',
            value: 0.6
        },
        {
            itemName: 'body',
            value: 0.45
        },
        {
            itemName: 'weapon',
            value: 0 - 85
        },
        {
            itemName: 'scope',
            value: 0 - 1.9
        }
    ]
];

const CIRCLE_DAMAGE = [0.1, 0.2, 0.4, 0.8, 0.16, 0.32, 0.64];

export default class Simulation {
    players: Player[] = [];

    plane: {
        direction: vec3;
        position: vec3;
    };

    blueCircle: vec3;
    safeZone: vec3;
    time: number = 0;
    circleNumber: number = 0;
    prevCircleTime: number = Date.now();
    lastJump: number = Date.now();
    maxPlayers: number;

    constructor(playerNames: string[], public locations: Location[]) {
        shuffle(playerNames);
        for (const name of playerNames) {
            this.players.push(new Player(name));
        }

        this.maxPlayers = this.players.length;

        const direction = (vec2.random(
            (vec3.create() as any) as vec2
        ) as any) as vec3;
        const position = vec3.create();
        vec3.scaleAndAdd(position, position, direction, -4000);
        position[2] = PLANE_ALTITUDE;

        this.plane = {
            direction,
            position
        };

        // TODO: Initialize plane position/direction
    }

    simulateInAir(player: Player) {
        if (player.position[2] === PLANE_ALTITUDE) {
            // In the plane
            vec3.copy(player.position, this.plane.position);

            // SPEEDS.PLANE = 500 units / 60 tick
            // 1 sec = 60 ticks
            // dist / 60 / 1000 = dist/ms

            // travelDistance = 8000 units;
            // plane travels = 500 units / 60 tick  =

            // travelTime = 60 * 8000 / 500 (spd) = 960 ticks
            // 960 / 60 = 16sec
            // drop every 16 / 100
            const travelDistance = 8000;

            const travelTime = travelDistance / SPEEDS.PLANE / 60 * 1000; // ms

            const dropDistance = travelTime / this.maxPlayers;

            if (
                Date.now() - this.lastJump > dropDistance &&
                Math.random() < 0.1
            ) {
                this.lastJump = Date.now();
                player.position[2] -= 5;
            }
        } else {
            // Falling

            this.adjustDirection(player);

            vec3.scaleAndAdd(
                player.position,
                player.position,
                player.direction,
                SPEEDS.SKYDIVING
            );
            player.position[2] -= SPEEDS.FALLING;

            if (player.position[2] < 0) {
                player.position[2] = 0;
            }
        }
    }

    adjustDirection(player: Player) {
        const safeZone = this.safeZone;

        const distFromCenter = vec2.distance(
            (player.position as any) as vec2,
            (safeZone as any) as vec2
        );

        let adjustFactor = 0;

        if (distFromCenter < safeZone[2]) {
            adjustFactor =
                distFromCenter / safeZone[2] * DIRECTION_ADJUST_FACTOR * 0.18;
        } else {
            adjustFactor =
                distFromCenter / safeZone[2] * DIRECTION_ADJUST_FACTOR;
        }

        const vecToCenter = vec2.subtract(
            vec2.create(),
            (safeZone as any) as vec2,
            (player.position as any) as vec2
        );

        vec2.normalize(vecToCenter, vecToCenter);

        const a = (player.direction as any) as vec2;
        const b = vecToCenter;

        const angle =
            Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]) *
                adjustFactor +
            (Math.random() - 0.5) * Math.PI * DIRECTION_VARIANCE;

        const s = Math.sin(angle);
        const c = Math.cos(angle);

        const newDir = vec3.fromValues(
            player.direction[0] * c - player.direction[1] * s,
            player.direction[0] * s + player.direction[1] * c,
            0
        );

        player.direction = vec2.normalize(
            (newDir as any) as vec2,
            (newDir as any) as vec2
        ) as any as vec3;
    }

    emitKillNotify(killer: Player, victim: Player, shotPosition: string) {
        console.log(
            `${killer.name} killed ${victim.name} with a ${shotPosition}shot.`
        );
    }

    simulateFight(player1: Player, player2: Player) {
        const distance = vec3.distance(player1.position, player2.position);
        const chance = distance / VISIBLE_AOE * BASE_HIT_CHANCE;

        const hitPositionChances: [number, string][] = [
            [0.2, 'head'],
            [0.5, 'body'],
            [1, 'arm']
        ];

        if (Math.random() < chance) {
            const r = Math.random();
            let position = '';

            for (const hitPosition of hitPositionChances) {
                if (r < hitPosition[0]) {
                    position = hitPosition[1];
                    break;
                }
            }

            const damage =
                -player1.inventory.weapon *
                -player1.inventory.scope *
                player2.inventory[position];
            player2.health -= damage * 0.08;

            if (player2.health <= 0) {
                this.emitKillNotify(player1, player2, position);
            }
        }
    }

    simulateInventory(player: Player) {
        const bug = Math.random();

        const lootChanceTable = [0.08, 0.01, 0.004];

        for (let i = 0; i < 3; i += 1) {
            const lootChance = lootChanceTable[2 - i];
            const lootTable = ITEM_LEVELS[2 - i];
            if (bug < lootChance) {
                const itemNumber = Math.floor(Math.random() * lootTable.length);

                const item = lootTable[itemNumber];
                if (item.value < player.inventory[item.itemName]) {
                    player.inventory[item.itemName] = item.value;
                }

                break;
            }
        }

        // for (const location of this.locations) {
        //     if (
        //         vec2.distance(
        //             location.position,
        //             (player.position as any) as vec2
        //         ) < location.radius
        //     ) {
        //         const bug = Math.random();

        //         for (let i = 0; i < 3; i += 1) {
        //             const lootChance = location.lootChance[2 - i];
        //             const lootTable = ITEM_LEVELS[2 - i];
        //             if (bug < lootChance) {
        //                 const itemNumber = Math.floor(
        //                     Math.random() * lootTable.length
        //                 );

        //                 const item = lootTable[itemNumber];
        //                 if (player.inventory[item.itemName] < item.value) {
        //                     player.inventory[item.itemName] = item.value;
        //                 }

        //                 break;
        //             }
        //         }
        //     }
        // }
    }

    simulateOnGround(player: Player) {
        if (
            vec2.distance(
                (this.blueCircle as any) as vec2,
                (player.position as any) as vec2
            ) > this.blueCircle[2]
        ) {
            // Ramp up hp loss per tick based on circle
            player.health -= CIRCLE_DAMAGE[this.circleNumber];
        }

        if (player.targetting && player.targetting.health <= 0) {
            player.targetting = null;
        }

        if (player.targetting) {
            this.simulateFight(player, player.targetting);
        } else {
            if (player.inventory.weapon) {
                for (const enemy of this.players) {
                    const distance = vec3.distance(
                        enemy.position,
                        player.position
                    );
                    if (enemy !== player && distance < VISIBLE_AOE) {
                        const chance = distance / VISIBLE_AOE;
                        if (Math.random() < chance) {
                            player.targetting = enemy;
                            break;
                        }
                    }
                }
            }

            if (!player.targetting) {
                // Simulate direction movement (away from blue)
                this.simulateInventory(player);
                vec3.scaleAndAdd(
                    player.position,
                    player.position,
                    player.direction,
                    SPEEDS.WALKING
                );
                this.adjustDirection(player);
            }
        }
    }

    simulateCircles() {
        if (!this.safeZone) {
            this.safeZone = vec3.fromValues(
                Math.random() * 4000 - 2000,
                Math.random() * 4000 - 2000,
                CIRCLE_RADII[1]
            );
            this.blueCircle = vec3.fromValues(0, 0, CIRCLE_RADII[0]);
            this.circleNumber += 1;
        }

        if (
            Date.now() - this.prevCircleTime >
            CIRCLE_DELAY[this.circleNumber - 1] * 1000
        ) {
            this.blueCircle[2] -= SPEEDS.CIRCLE;

            const ticksRemaining =
                (this.blueCircle[2] - this.safeZone[2]) / SPEEDS.CIRCLE;
            vec2.lerp(
                (this.blueCircle as any) as vec2,
                (this.blueCircle as any) as vec2,
                (this.safeZone as any) as vec2,
                1 / ticksRemaining
            );
        }

        if (this.blueCircle[2] <= this.safeZone[2]) {
            this.prevCircleTime = Date.now();
            this.blueCircle = this.safeZone;
            this.circleNumber += 1;

            const newRadius = CIRCLE_RADII[this.circleNumber];

            const newCenter = vec2.random((vec3.fromValues(
                0,
                0,
                newRadius
            ) as any) as vec2);

            this.safeZone = (vec2.scaleAndAdd(
                newCenter,
                (this.safeZone as any) as vec2,
                newCenter,
                Math.random() * (this.safeZone[2] - newRadius)
            ) as any) as vec3;
            // update safe zone
        }
    }

    center = vec2.create();

    simulateStep() {
        this.time += TIME_STEP;

        // Update Plane Location

        // If still flying:
        vec3.scaleAndAdd(
            this.plane.position,
            this.plane.position,
            this.plane.direction,
            SPEEDS.PLANE
        );

        const dist = vec2.distance(
            (this.plane.position as any) as vec2,
            this.center
        );
        if (dist > 4000) {
            for (const player of this.players) {
                if (player.position[2] === PLANE_ALTITUDE) {
                    player.position[2] -= 5;
                }
            }
        }

        this.simulateCircles();

        const removeDeadPlayers = [];

        if (this.players.length > 1) {
            for (const player of this.players) {
                if (player.health <= 0) {
                    removeDeadPlayers.push(player);
                    continue;
                }

                if (player.position[2] > 0) {
                    // In the air
                    this.simulateInAir(player);
                } else {
                    // On the ground
                    this.simulateOnGround(player);
                }
            }

            for (const player of removeDeadPlayers) {
                const pIdx = this.players.indexOf(player);
                if (pIdx !== -1) {
                    this.players.splice(pIdx, 1);
                }
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        const canvas = context.canvas;

        for (const player of this.players) {
            if (player.position[2] < PLANE_ALTITUDE) {
                player.draw(context);
            }
        }

        context.fillStyle = '#ff0000';
        context.beginPath();
        context.ellipse(
            this.plane.position[0],
            this.plane.position[1],
            50,
            50,
            0,
            0,
            2 * Math.PI
        );
        context.fill();

        if (this.safeZone) {
            context.strokeStyle = '#ffffff';
            context.lineWidth = 10;
            context.beginPath();
            context.ellipse(
                this.safeZone[0],
                this.safeZone[1],
                this.safeZone[2],
                this.safeZone[2],
                0,
                0,
                2 * Math.PI
            );
            context.stroke();
        }

        if (this.blueCircle && this.blueCircle[2] > 0) {
            context.strokeStyle = '#0000ff';
            context.lineWidth = 10;
            context.beginPath();
            context.ellipse(
                this.blueCircle[0],
                this.blueCircle[1],
                this.blueCircle[2],
                this.blueCircle[2],
                0,
                0,
                2 * Math.PI
            );
            context.stroke();
        }

        if (this.players.length === 1) {
            context.fillStyle = '#FFFFFF';
            context.font = '500px sans-serif';
            context.textAlign = 'center';

            context.fillText(this.players[0].name, 0, 0);
        }
    }
}
