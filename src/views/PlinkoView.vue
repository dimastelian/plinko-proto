<template>
  <div class="plinko">
    <div class="topBar">
        <button @click="changeRows()">Rows: <em>{{ rows}}</em></button>
        <button @click="changeWidth()">Width: <em>{{ width}}</em></button>
        <button @click="changeHeight()">Height: <em>{{ height }}</em></button>

        <button @click="genPath">Path</button>

    </div>

    <div class="gameWindow">
        <div class="plinkoContainer">
            <svg id="canvas" 
                :width="`${width}${unit}`"
                :height="`${height}${unit}`"
            >
                <g class="background" />
                <g class="paths" />
                <g class="balls" />
                <g class="pins" />
            </svg>
        </div>
        <div class="sidebar">
            <h3>Game Secret</h3>
            <input type="text" v-model="outcome.secret" />
            <h3>Hashes</h3>
            <div class="controls">
                <button @click="runStaggeredSeeds">Run Staggered</button>
            </div>
            <div class="controls">
                <button @click="runRandomSeed">Run Random</button>
            </div>
            <div class="seedList">
                <button @click="addSeed(1)">+</button>
                <button @click="addSeed(10)">+10</button>
                <button @click="addSeed(100)">+100</button>
            </div>
            <div v-for="(seed,i) in outcome.seeds" :key="`seed-${i}`" class="seedList">
                <input type="text" v-model="seed.value" />
                <button @click="removeSeed(i)">-</button>
            </div>

        </div>
    </div>
  </div>
</template>

<script>

import {
    select as d3_select
} from "d3";

import * as board from "@/libs/plinko_board.js";
import * as outcomes from "@/libs/plinko_outcomes.js";

import sha256 from 'crypto-js/sha256';

var svg;

const delay = (n) => new Promise(resolve => {setTimeout(resolve, n)});

export default {

    data() {
        return {
            rows: 8,
            maxRows: 16,
            width: 50,
            height: 50,
            unit: "rem",
            ball: {
                size: 0.5
            },
            pin: {
                size: 0.5,
                spacing: 1,
            },
            offset_top: 100,

            outcome: {
                secret: [
                    "secretstring"
                ],
                seeds: [
                    {value: "12345"},
                    // {value: "abcdef"},
                    // {value: "wertfjoer"},
                    // {value: "123424p3"},
                ]
            }
        }
    },

    mounted() {

        console.log('MOUNTED!')

        board.setCanvas('#canvas');
        board.setConfig(this.$data);
        board.draw();
    },

    methods: {
        changeRows() {
            this.rows += 1;
            if(this.rows > 16) {
                this.rows = 8;
            }
        },
        changeHeight() {
            if(this.height === 30) {
                this.height = 50;
            } else {
                this.height = 30;
            }
        },
        changeWidth() {
            if(this.width === 30) {
                this.width = 50;
            } else {
                this.width = 30;
            }
        },
        genPath() {
            const outcome = outcomes.generate_random({
                rows: this.rows,
            });

            board.setOutcomes([
                outcome
            ]);

            board.drawPaths();
        },

        async runStaggeredSeeds() {
            for(var s of this.outcome.seeds) {
                const outcome = outcomes.generate_from_hash({
                    rows: this.rows,
                    secret: this.outcome.secret,
                    seed: s.value
                });

                console.log('outcome', Object.freeze(outcome));
                // board.setOutcomes([
                //     outcome
                // ]);

                // board.drawPaths();
                board.playRound(outcome);
                await delay(50);
            }
        },

        async runRandomSeed() {
            var s = sha256(this.outcome.secret+Date.now());
            const outcome = outcomes.generate_from_hash({
                rows: this.rows,
                secret: this.outcome.secret,
                seed: s
            });
            board.playRound(outcome);
        },

        removeSeed(n) {
            this.outcome.seeds.splice(n, 1);
        },
        addSeed(num=1) {
            for(var i = 0; i < num; i++) {
                var s = sha256(this.outcome.secret+Date.now()+i);
                this.outcome.seeds.push({value: s});
            }
        }
    },

    watch: {
        $data: {
            handler(data) {
                this.$nextTick(() => {
                    board.setConfig(this.$data);
                    board.draw();
                })
            },
            deep: true
        }
    }

}
</script>

<style lang="scss">

    .topBar {
        margin: 1rem 0;

    }

    .topBar button {
        background: #333;
        border: none;
        color: #999;
        padding: 0.25rem 0.5rem;
        margin: 0.1rem;
        font-family: Consolas, "Ubuntu Mono", monospace;
    }

    .topBar button em {
        color: #ff0;
        font-style: normal;
    }

    .gameWindow {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-end;
        align-content: stretch;
        align-items: flex-start;
        row-gap: 1rem;

        .plinkoContainer {
            margin: 0 auto;
        }

        .sidebar {
            background: #202020;
            width: 30rem;
            padding: 1rem;
            flex: 0 1 auto;

            input {
                background: #2f2f2f;
                padding: 0.5rem 1rem;
                margin: 0.5rem 0;
                font-family: Consolas, "Ubuntu Mono", monospace;
                color: #ccc;
                border: 1px solid #3c3c3c;
                width: 100%;
            }

            button {
                background: #225977;
                margin: 0.5rem 0;
                padding: 0.2rem 0.4rem;
                font-family: Consolas, "Ubuntu Mono", monospace;
                color: #ccc;
                border: 1px solid #397371;
            }

            .seedList {
                display: flex;
                gap: 0.5rem;
            }
        }
    }

    #canvas {
        border: 1px solid red;
    }
</style>
