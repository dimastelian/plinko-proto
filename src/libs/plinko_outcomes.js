
import sha256 from 'crypto-js/sha256';

function get_random_outcome(row, lastPin=0) {

    if(row === 0) {
        return {
            row,
            pin: 1,
            spread: 0
        }
    }

    // 0 is left, 1 is right
    var outcome = Math.random() > 0.5 ? 1 : 0;
    var pin = lastPin + outcome;

    const perRow = row + 3;

    if(pin <= 0) {
        pin += 1;
    }

    else if(pin >= perRow) {
        pin -= 1;
    }

    var spread = 0.1 + Math.random()*0.9;

    if(outcome == 0) {
        spread = spread * -1;
    }

    return {
        row, pin, spread
    }
}


export function generate_same({rows}) {
    var outcomes = "LLRRLRLRLRLRLRLRLRLRLRLRL".split("");
    var spreads = [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25];

    // the ball always hits the middle pin on the first row
    // the first row has 3 pins (0,1,2) so 1 is the middle one
    var results = [
        {
            row: 0, 
            pin: 1,
            spread: 0
        }
    ];
    pin = 1;
    for(let i = 1; i <= rows; i++) {

        const spreadIndex = i % spreads.length;
        const outcome = outcomes[i-1];

        const perRow = i + 3;

        var pin;
        var spread = Math.random(); //spreads[spreadIndex];
        
        var change = 0;
        if(outcome === "L") {
            change = 1;
        } else {
            change = 0;
        }

        if(pin <= 0) {
            change = 1;
        }
    
        else if(pin >= perRow) {
            change = 0;
        }

        pin += change;

        if(change === 0 && results[i-1]) {
            results[i-1].spread = results[i-1].spread * -1;
            // spread = spread*-1;
        }

        results.push({
            row: i,
            pin,
            spread
        })
    }

    return results;

}

export function generate_random({rows}) {

    // the first row has 3 obstacles (0, 1, 2)
    // 1 is the middle one

    var outcomes = [];

    var o = get_random_outcome(0);
    var pin = o.pin;
    outcomes.push(o);

    // build the path for the following rows
    for(var i = 1; i <= rows; i++) {

        o = get_random_outcome(i, pin);
        pin = o.pin;
        outcomes.push(o);

    }

    return outcomes;
}

export function generate_from_hash({rows, secret, seed}) {
    const roundHash = sha256(secret+seed);

    const rowHashes = [];
    for(let r=1; r <= rows; r++) {
        const rowHash = sha256(`${roundHash}:row:${r}`);
        rowHashes.push({row: r, hash: rowHash.toString()});
    }

    // start at the middle bucket
    // for 8 rows, the bucket is 4+1 => 5th
    var bucket = Math.floor(rows/2)+1;

    // the ball always hits the middle pin on the first row
    // the first row has 3 pins (0,1,2) so 1 is the middle one
    var pin = 1;

    var outcomes = [
        {
            row: 0,
            pin,
            bucket,
            spread: 0
        }
    ];

    const bytes = 13;
    const nBits = bytes * 4;

    for(let rowHash of rowHashes) {

        const row = rowHash.row;
        const hash = rowHash.hash;

        // taken from the crash code
        var slice = hash.slice(0, bytes);
        var e = parseInt(slice, 16);
        var h = Math.pow(2, nBits);

        // this is the actual result
        var result = e/h;

        // 1 - right, -1 - left
        var direction = result >= 0.5 ? 1 : -1;

        // spread is how far it deviates from the middle point (0.5)
        // if result is 0.1 (far left), spread will be 0.4
        // if result is 0.9 (far right) spread will e 0.4
        var spread = Math.abs(result - 0.5);

        // the game starts with 3 pins on the first row, 4 on the next, and so on
        const pinsPerRow = 3+row;

        bucket += direction;
        pin += direction > 0 ? 1 : -1;

        // console.log('Row', row, bucket, pinsPerRow, e/h);

        outcomes.push({
            row,
            spread,
            direction,
            bucket,
            pin,
        });
    }

    return outcomes;
}