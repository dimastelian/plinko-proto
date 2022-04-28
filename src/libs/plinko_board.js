import {
    select as d3_select,
    path as d3_path
} from "d3";

import * as d3 from "d3";

import anime from 'animejs/lib/anime.es.js';

var svg = {
    elem: null,

    // these are the layers to draw on
    background: null,
    paths: null,
    balls: null,
    pins: null
}

var config = {
    rows: 8,
    maxRows: 16,
    pin: {
        size: 1,
        spacing: 1,
    },
    offset_top: 100
};

// store calculated stuff
const data = {
    width: null,
    height: null,

    // pins (obstacles size)
    pins: {
        size: 10,
        hSpacing: 10,
        vSpacing: 10
    },

    outcomes: [],

    paths: [],
}

export function setCanvas(id) {
    svg.elem = d3_select(id);
    svg.background = svg.elem.select('.background');
    svg.paths = svg.elem.select('.paths');
    svg.balls = svg.elem.select('.balls');
    svg.pins = svg.elem.select('.pins');
}

export function setConfig(cfg) {
    config = cfg;
}

export function draw() {
    setup_canvas();
    setup_pins();

    draw_pins();
    // draw_buckets();
}

export function setOutcomes(outcomeArray) {
    data.outcomes = outcomeArray;

    updatePaths(data.outcomes, { reset: true });
}

export function updatePaths(outcomes, { reset = false }) {
    if (reset) {
        data.paths = [];
        draw();
    }

    console.log('OUTCOMES', outcomes);
    for (let outcome of outcomes) {

        var origin = { x: data.width / 2, y: 25 };
        const ctx = d3_path();
        ctx.moveTo(origin.x, origin.y);

        for (var idx in outcome) {
            var { row, pin, spread } = outcome[idx];

            path_to_row(ctx, row, pin, spread);
        }

        data.paths.push({
            origin,
            ctx
        })
    }
}

export function drawPaths() {

    for (let path of data.paths) {
        draw_path(path);
    }
}

export function playRound(outcome) {
    console.log('OUTCOMES', outcome);

    var origin = { x: data.width / 2, y: 25 };

    const ctx = d3_path();
    ctx.moveTo(origin.x, origin.y);
    for (var idx in outcome) {
        var { row, pin, spread } = outcome[idx];

        path_to_row(ctx, row, pin, spread);
    }

    var p = {
        origin,
        ctx
    }

    draw_path(p);
}

function setup_canvas() {
    const node = svg.elem.node();
    data.width = node.getBoundingClientRect().width;
    data.height = node.getBoundingClientRect().height;
}

function calc_pin_point(row, pos, spread) {

    // pin radius
    const r = data.pins.size;

    // pin spacing
    const h_spacing = data.pins.hSpacing;
    const v_spacing = data.pins.vSpacing;
    const perRow = 3 + row;

    const yOffset = (row * v_spacing);

    const x = (data.width / 2 + h_spacing) - (perRow * h_spacing) + (pos * h_spacing * 2);
    const y = config.offset_top + yOffset;

    return { x, y, r, yOffset };
}

function calc_bucket_point(pos) {
    const numBuckets = config.rows + 1;

    // pin radius
    const r = data.pins.size;
    // pin spacing
    const h_spacing = data.pins.hSpacing;
    const v_spacing = data.pins.vSpacing;

    const vSpacing = 370;
    const w = 30;
    const h = 20;
    const x = (data.width / 2) - ((h_spacing) * pos);
    const y = config.offset_top + vSpacing;

    return { x, y, r, w, h, vSpacing };
}

function setup_pins() {

    // calculate obstacle size based on rows
    // data.pins.size = plinko.maxRows * plinko.obstacle.size / plinko.rows / 2;
    data.pins.size = data.width / config.rows * 0.1 * config.pin.size;

    // calculate obstacle spacing based on rows
    // horizontal spacing
    data.pins.hSpacing = data.width / config.rows / 3 * config.pin.spacing;

    // vertical spacing
    data.pins.vSpacing = (data.height - config.offset_top) / (config.rows * 1.25);

    var obstacles = [];

    for (var row = 0; row < config.rows; row++) {

        const perRow = 3 + row;

        obstacles[row] = [];

        for (var pos = 0; pos < perRow; pos++) {
            const p = calc_pin_point(row, pos);
            obstacles[row].push({
                cx: p.x,
                cy: p.y,
                r: p.r,
                vSpacing: p.yOffset,
            })
        }
    }
    data.obstacles = obstacles;
}

function path_to_row(ctx, row, pinPos, spread) {

    console.log('RRR', row, pinPos);

    pinPos = row % 3 ? pinPos+1 : pinPos;

    var point = calc_pin_point(row, pinPos, spread);
    var pinSize = data.pins.size;

    var spreadDir = spread < 0 ? -1 : 1;
    var spreadAbs = Math.abs(spread);

    var dx = point.x;
    var dy = point.y;

    var x = dx;
    var y = dy;

    var sx = Math.floor(x + (pinSize*2*spread));
    var sy = Math.floor(y - (pinSize*3));

    var rad = Math.atan2(sy - y, sx - x);
    var x = dx + Math.cos(rad) * pinSize;
    var y = dy - pinSize + Math.sin(rad) * pinSize;

    var cpx1 = x;
    var cpx2 = x;
    var cpy1 = y;
    var cpy2 = y;

    
    var curve = Math.max(30, 60 * (1-spreadAbs));
    if(row === 1) {
        cpy1 -= curve*2;
    } else if(row > 1) {
        cpy1 -= curve;
    }
    // cpx1 -= spread * 20;

    

    console.log('DD', row, cpy1 - sy, spreadAbs)

    // ctx.quadraticCurveTo(cpx1, cpy1, x,y);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y)

    var ymod = 20;
    var xmod = 2;
    var maxJitter = Math.max(3, 5*(1-spreadAbs));
    for(var j = 0; j < maxJitter; j++) {
        x += xmod*spreadDir;
        ymod *= 0.5*spreadAbs;
        xmod *= 0.75;
        ctx.lineTo(x, y-ymod);
        xmod *= 0.75;
        x += xmod*spread;
        ctx.lineTo(x, y);
    }

   
    // cpy1 -= 50;

    // ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y)
    


    // draw control points for debugging purposes

    // svg.append('line')
    //     .attr('x1', dx).attr('y1', dy)
    //     .attr('x2', x).attr('y2', y)
    //     .attr('stroke', 'purple')
    //     .attr('stroke-width', 1)

    // svg.append('line')
    //     .attr('x1', x).attr('y1', y).attr('x2', cpx1).attr('y2', cpy1)
    //     .attr('stroke', 'gray').attr('stroke-width', '0.5')

    // svg.append('circle')
    //     .attr('r', 2)
    //     .attr('cx', cpx1).attr('cy', cpy1)
    //     .attr('stroke', 'transparent').attr('fill', 'red');

    // svg.append('line')
    //     .attr('x1', x).attr('y1', y)
    //     .attr('x2', cpx2).attr('y2', cpy2)
    //     .attr('stroke', 'gray')
    //     .attr('stroke-width', '0.5')

    // svg.append('circle')
    //     .attr('r', 2)
    //     .attr('cx', cpx2).attr('cy', cpy2)
    //     .attr('stroke', 'transparent')
    //     .attr('fill', 'blue');

    // ctx.lineTo(x,y);
}

function draw_pins() {

    for (var row in data.obstacles) {
        for (var o of data.obstacles[row]) {
            // Add the path using this helper function
            

            // draw shadow
            svg.background.append('circle')
                .attr('cx', o.cx)
                .attr('cy', o.cy+9)
                .attr('r', o.r-2)
                .attr('stroke', 'rgba(0,0,0, 0.5)')
                .attr('fill', 'rgba(0,0,0, 0.5)');

            // draw '3d' effect
            svg.background.append('circle')
                .attr('cx', o.cx)
                .attr('cy', o.cy+3)
                .attr('r', o.r)
                .attr('stroke', '#999')
                .attr('fill', '#999');

            // draw pin
            svg.pins.append('circle')
                .attr('cx', o.cx)
                .attr('cy', o.cy)
                .attr('r', o.r)
                .attr('stroke', '#d0d0d0')
                .attr('fill', '#c0c0c0');

        }
    }
}

function draw_buckets() {

    const numBuckets = config.rows + 1;
    for (var i = 0; i < numBuckets; i++) {
        var o = calc_bucket_point(i);
        var mid = Math.ceil(numBuckets / 2);
        var dist = Math.abs(mid - 1 - i) / mid;

        svg.append('rect')
            .attr('x', o.x)
            .attr('y', o.y)
            .attr('width', o.w)
            .attr('height', o.h)
            .attr('stroke', 'black')
            .attr('fill', `hsl(0 100% ${100 - (dist * 100)}%)`);
    }
}

function draw_path(path) {
    var origin = path.origin;

    var e = svg.paths.append('path')
        .attr('d', path.ctx.toString())
        .attr('stroke', '#00ff00')
        .attr('stroke-width', 0)
        .attr('fill', 'transparent')

    path.elem = e;

    var ball = svg.balls.append('circle')
        // .attr('cx', origin.x)
        // .attr('cy', origin.y)
        .attr('r', 10)
        .attr('stroke', 'black')
        .attr('fill', '#ff0000')
        .attr('class', 'ball');

    var animePath = anime.path(path.elem.node());

    var motionPath = anime({
        targets: ball.node(),
        translateX: animePath('x'),
        translateY: animePath('y'),
        rotate: animePath('angle'),
        elasticity: 200,
        easing: "linear",
        duration: 2000,
        loop: false,
        complete: function(anim) {
            console.log("COMPLETE")
            if(path.elem) {
                path.elem.remove();
            }
        }
      });

    // anime({
    //     targets: ball.node(),
    //     keyframes: [
    //       {translateY: -40},
    //       {translateX: 250},
    //       {translateY: 40},
    //       {translateX: 0},
    //       {translateY: 0}
    //     ],
    //     duration: 4000,
    //     easing: 'easeOutElastic(1, .8)',
    //     loop: true
    //   });

}

