// Phase weaves cancel themselves such as R3 R-2 R1
// Exchange weaves swap anyons like R5

/* global $, document, _, d3, math */
const flatten = arr => arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);

function traverse (x) {
    if (Object.prototype.toString.call(x) === "[object Array]") {
        traverseArray(x);
        console.log(x);
    } else {
        console.log(x);
    }
}

function traverseArray (arr) {
    arr.forEach(function (x) {
        traverse(x);
    });
}


//--------------------------ANYONS----------------------------------------------
class Anyon {
    constructor(id, y, charge) {
        this.id = id;
        this.y = y;
        this.z = 1;
        this.history = [];
        this.charge = charge;
    }

    debug() {
        console.log(`ID: ${this.id} - Y POS: ${this.y} - ZINDEX: ${this.z} - ${this.history}`);
    }
}


//--------------------------BRAID-----------------------------------------------
class Braid {
    constructor(data) {
        // process structure
        this.structure = data[1];

        // process instructions (sanitize with weaving logic)
        this.instructions = [];
        var unprocessed = data[0].split(" ");
        for (var instr of unprocessed) {
            if (instr[0] === "B" || instr[0] === "R") {
                this.instructions.push([instr[0], parseInt(instr.replace(/[^\d-]/g, ""))]);
            }
        }
        this.size = flatten(this.structure).length;
        this.steps = 0;
        this.anyons = new Array(1);
        this.anyons[0] = [];
        var element = flatten(this.structure);
        for (var i = 0; i < this.size; i++) {
            var charge = (element[i] > 0) ? "T" : "1";
            this.anyons[0].push(new Anyon(i, i, charge));
        }
        this.loadPattern();
    }

    load(data) {
        this.steps = 0;
        this.anyons = new Array(1);
        this.anyons[0] = [];
        this.instructions = [];
        var unprocessed = data[0].split(" ");
        for (var instr of unprocessed) {
            if (instr[0] === "B" || instr[0] === "R") {
                this.instructions.push([instr[0], parseInt(instr.replace(/[^\d-]/g, ""))]);
            }
        }
        for (var anyon of this.anyons[0]) {
            anyon.history = [];
        }
        var element = flatten(this.structure);
        for (var i = 0; i < this.size; i++) {
            var charge = (element[i] > 0) ? "T" : "1";
            this.anyons[0].push(new Anyon(i, i, charge));
        }
        this.loadPattern();
    }

    matrixOperation() {
        var f = "[[phi^-1, sqrt(phi^-1)], [sqrt(phi^-1), -phi^-1]]";
        var r = "[[e^(-4*i*pi/5), 0], [0, -e^(-2*i*pi/5)]]";
        var rInv = "[[e^(4*i*pi/5), 0], [0, -e^(2*i*pi/5)]]";
        var b = "[[-(sqrt(5) - 1) / 2 *e^(-4*i*pi/5), -i*sqrt((sqrt(5) - 1) / 2)e^(-i*pi/10)], [-i*sqrt((sqrt(5) - 1) / 2)e^(-i*pi/10), -(sqrt(5) - 1) / 2]]";
        //var b = "{{-((sqrt(5) - 1) / 2) *e^(-4*i*pi/5), -i*sqrt(((sqrt(5) - 1) / 2)e^(-i*pi/10)}, {-i*sqrt((sqrt(5) - 1) / 2)e^(-i*pi/10), -(sqrt(5) - 1) / 2}}";
        var bInv = "[[1, 1], [1, 1]]";
        var result = [f];
        for (var operation of this.instructions) {
            if (operation[0] === "R" && operation[1] > 0) {
                for (var i = 0; i < operation[1]; i++) {
                    result.push(r);
                }
            } else if (operation[0] === "R" && operation[1] < 0) {
                for (i = 0; i < -operation[1]; i++) {
                    result.push(rInv);
                }
            } else if (operation[0] === "B" && operation[1] > 0) {
                for (i = 0; i < operation[1]; i++) {
                    result.push(b);
                }
            } else if (operation[0] === "B" && operation[1] < 0) {
                for (i = 0; i < -operation[1]; i++) {
                    result.push(bInv);
                }
            }
            result.push(f);
        }
        result = result.join(" * ");
        console.log(result);
        var pretty = document.getElementById("pretty");
        var results = document.getElementById("result");

        pretty.innerHTML = "$$" + math.parse(result).toTex() + "$$";
        results.innerHTML = math.format(math.eval(result));
    }

    loadPattern() {
        var center = Math.floor(this.size / 2);
        for (var instruction of this.instructions) {
            var anyons = (instruction[0] === "R") ? [center, center + 1] : [center - 1, center];
            if (instruction[1] < 0) {
                anyons = anyons.reverse();
            }
            for (var i = 0; i < Math.abs(instruction[1]); i++) {
                this.weave(anyons[0], anyons[1]);
            }
        }
        this.matrixOperation();
    }

    static isValid(data) {
        var unprocessed = data.split(" ");
        var valid = true;
        for (var instr of unprocessed) {
            var letter = instr[0];
            var num = parseInt(instr.replace(/[^\d-]/g, ""));
            if (!((letter === "B" || letter === "R") && !isNaN(parseFloat(num)) && isFinite(num))) {
                valid = false;
            }
        }
        return valid;
    }

    parse(structure) {
        var anyons = flatten(structure);
        // { cx: -2,                            cy: 3,   rx: 1,   ry: 1.4 },
        // { cx: -2,                            cy: 0.5, rx: 0.8, ry: 0.9 },
        // { cx: -2,                            cy: 3.5, rx: 0.8, ry: 0.9 },
        // { cx: nodes[nodes.length - 1].x + 2, cy: 3,   rx: 1,   ry: 1.4 },
        // { cx: nodes[nodes.length - 1].x + 2, cy: 0.5, rx: 0.8, ry: 0.9 },
        // { cx: nodes[nodes.length - 1].x + 2, cy: 3.5, rx: 0.8, ry: 0.9 }
    }

    weave(pos1, pos2) {
        // save last state
        this.anyons[this.steps + 1] = this.anyons[this.steps].slice();
        this.steps++;
        // find anyons by position
        var anyon1 = this.anyons[this.steps][pos1];
        var anyon2 = this.anyons[this.steps][pos2];
        // update z-indexes
        anyon1.z = 1;
        anyon2.z = 0;
        // update histories
        for (var anyon of this.anyons[this.steps]) {
            anyon.history.push([anyon.y, anyon.z]);
        }
        // cross
        var save = anyon1.y;
        anyon1.y = anyon2.y;
        anyon2.y = save;
        this.anyons[this.steps][pos1] = anyon2;
        this.anyons[this.steps][pos2] = anyon1;
    }

    generateD3() {
        nodes = [];
        links = [];
        // generate instructions
        instructions = this.instructions;

        // generate nodes
        for (var x = 0; x <= this.steps; x++) {
            for (var y = 0; y < this.size; y++) {
                var node = {
                    id: this.anyons[x][y].value,
                    x: x,
                    y: y
                };
                nodes.push(node);
            }
        }

        // generate links
        for (y = 0; y < this.size; y++) {
            var values = [];
            var history = this.anyons[0][y].history;
            // convert history
            for (x = 0; x < history.length; x++) {
                values.push({
                    x: x,
                    y: history[x][0],
                    z: history[x][1],
                    id: this.anyons[this.size][[this.anyons[this.size][y].y]].id,
                });
            }
            // add current pos
            values.push({
                x: x,
                y: this.anyons[0][y].y,
                z: this.anyons[0][y].z,
                id: this.anyons[this.steps][[this.anyons[this.steps][y].y]].id
            });
            links.push({
                id: y,
                chargeStart: this.anyons[0][y].charge,
                chargeEnd: this.anyons[this.size][[this.anyons[this.size][y].y]].charge,
                values: values
            });
        }
    }

    debug() {
        var output = new Array(this.size);
        for (var i = 0; i < this.size; i++) {
            output[i] = "";
        }
        for (var x = 0; x <= this.steps; x++) {
            for (var y = 0; y < this.size; y++) {
                output[y] += this.anyons[x][y].id;
            }
        }
        for (var pos = 0; pos < this.size; pos++) {
            console.log(output[pos]);
        }
    }
}


//--------------------------INIT------------------------------------------------
// ID gate
var idGate = "B3 R-2 B-4 R2 B4 R2 B-2 R-2 B-4 R-4 B-2 R4 B2 R-2 B2 R2 B-2 R3";
var idStructure = [[0,0],[1,[1,1]]];
var idData = [idGate, idStructure];

// NOT gate
var notGate = "R-2 B-4 R4 B-2 R2 B2 R-2 B4 R-2 B4 R-2 B4 R2 B-4 R2 B-2 R2 B-2 R-2";
var notStructure = [1,[0,1]];
var notData = [notGate, notStructure];

// Braidings
var s1Braiding = "R-1 B2 R-1 B-1 R1 B-1";
var s1Data = [s1Braiding, notStructure];


var injectionBraiding = "B3 R-2 B-4 R2 B4 R2 B-2 R-2 B-4 R-4 B-2 R4 B2 R-2 B2 R2 B-2 R3";

// initialize braid
var nodes = [];
var links = [];
var instructions = [];
var data = s1Data;
var braid = new Braid(data);
braid.generateD3();
drawBraid();
traverse(idStructure);

// controls
var inputStruct = document.getElementById("structure");
inputStruct.value = JSON.stringify(data[1]);
var inputInstr = document.getElementById("instructions");
inputInstr.value = data[0];

inputInstr.addEventListener("input", function() {
    if (Braid.isValid(inputInstr.value) === true) {
        console.log("VALID INSTRUCTIONS: ", inputInstr.value);
        braid.load([inputInstr.value, notStructure]);
        braid.generateD3();
        drawBraid();
    } else {
        console.log("INVALID INSTRUCTIONS: ", inputInstr.value);
    }
});


//--------------------------D3--------------------------------------------------
function drawBraid() {
    var svg = d3.select("svg");
    d3.select("svg").selectAll("*").remove();
    var margin = {
        top: 20,
        right: 80,
        bottom: 20,
        left: 80
    };
    svg.attr("height", 200);
    svg.attr("width", 1000);
    var width = svg.attr("width") - margin.left - margin.right;
    var height = svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // scale values
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([0, height]);
    var z = d3.scaleOrdinal(d3.schemeCategory10);

    // domain to scale
    x.domain(d3.extent(nodes, function(d) { return d.x; }));
    y.domain([
        d3.min(nodes, function(d) { return d.y; }),
        d3.max(nodes, function(d) { return d.y; })
    ]);
    z.domain(nodes.map(function(c) { return c.id; }));

    // define the line generating function
    var line = d3.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); })
        .curve(d3.curveMonotoneX);

    // Add the nodes
    g.selectAll(".dot")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 2)
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); });

    //Draw the groups ellipses
    var ellipses = [
        { cx: -2,                            cy: 3,   rx: 1,   ry: 1.4 },
        { cx: -2,                            cy: 0.5, rx: 0.8, ry: 0.9 },
        { cx: -2,                            cy: 3.5, rx: 0.8, ry: 0.9 },
        { cx: nodes[nodes.length - 1].x + 2, cy: 3,   rx: 1,   ry: 1.4 },
        { cx: nodes[nodes.length - 1].x + 2, cy: 0.5, rx: 0.8, ry: 0.9 },
        { cx: nodes[nodes.length - 1].x + 2, cy: 3.5, rx: 0.8, ry: 0.9 }
    ];
    g.selectAll(".ellipse")
        .data(ellipses)
        .enter().append("ellipse")
        .attr("cx", function(d) { return x(d.cx); })
        .attr("cy", function(d) { return y(d.cy); })
        .attr("rx", function(d) { return x(d.rx); })
        .attr("ry", function(d) { return y(d.ry); })
        .style("stroke", "grey")
        .style("stroke-width", "3");

    // Add the ellipses anyons
    g.selectAll(".anyons")
        .data(links)
        .enter().append("circle")
        .attr("r", 6)
        .attr("cx", function(d) { return x(-2); })
        .attr("cy", function(d) { return y(d.id); })
        .style("fill", function(d) { return (d.chargeStart === "T") ? "dimgrey" : "white"; });
    g.selectAll(".anyons")
        .data(links)
        .enter().append("circle")
        .attr("r", 6)
        .attr("cx", function(d) { return x(nodes[nodes.length - 1].x + 2); })
        .attr("cy", function(d) { return y(d.id); })
        .style("fill", function(d) { return (d.chargeEnd === "T") ? "dimgrey" : "white"; });

    // Add the matrix operations
    var sum = 0;
    g.selectAll(".text")
        .data(instructions)
        .enter().append("text")
        .attr("x", function(d) {
            var val = Math.abs(d[1]);
            sum += val;
            return x(sum - val/2);
        })
        .attr("y", function(d) {
            return (d[0] === "B") ? 25 : 150;
        })
        .style("text-anchor", "middle")
        .text(function(d) { return d[0] + d[1]; });

    // Weave the paths
    for (var step = 1; step < links[0].values.length; step++) {
        var slices = [];

        // Create paths with curve padding
        for (var i = 0; i < links.length; i++) {
            var slice1 = links[i].values[step-1];
            var padding1 = {
                x: slice1.x + 0.12,
                y: slice1.y,
                z: slice1.z,
                id: slice1.id
            };
            var slice2 = links[i].values[step];
            var padding2 = {
                x: slice2.x - 0.12,
                y: slice2.y,
                z: slice2.z,
                id: slice2.id
            };
            slices.push([slice1, padding1, padding2, slice2]);
        }

        // Ordering render
        slices.sort(function (a, b) {
            return a[0].z - b[0].z;
        });

        // Render segments
        for (i = 0; i < slices.length; i++) {
            g.append("path")
              .attr("class", "line")
              .attr("class", "anyon" + slices[i][1].id)
              .attr("d", function(d) {
                  return line(slices[i]);
              })
              .style("stroke", function(d) {
                  return z(slices[i][1].id);
              })
              .style("stroke-width", 4)
              .on("mouseover", function(d) {
                  svg.selectAll("." + this.getAttribute("class"))
                    .style("stroke-width", "6");
              })
              .on("mouseout", function(d) {
                  svg.selectAll("." + this.getAttribute("class"))
                    .style("stroke-width", "4");
              });
        }
    }
}
