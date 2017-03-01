// @flow
/* global $, document, _, d3, math */
const flatten = arr => arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);

//--------------------------ANYONS----------------------------------------------
class Anyon {
    id: number;
    y: number;
    z: number;
    history: [number, number];
    charge: string;

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
class Node {
    id: number;
    value: number;
    parent: number;

    constructor(id, value, parent) {
        this.id = id;
        this.value = value;
        this.parent = parent;
    }
}

//--------------------------BRAID-----------------------------------------------
class Braid {
    structure: Array<number>;
    steps: number;
    anyons: Array<[Class<Anyon>]>;
    size: number;
    matrix: string;

    constructor(structure) {
        this.structure = structure;
        this.steps = 0;
        this.anyons = new Array(1);
        this.anyons[0] = [];
        var elements = flatten(structure);
        this.size = elements.length;
        for (var i = 0; i < this.size; i++) {
            var charge = (elements[i] > 0) ? "T" : "1";
            this.anyons[0].push(new Anyon(i, i, charge));
        }
        this.parse(structure);
        this.matrix = "[[phi^-1, sqrt(phi^-1)], [sqrt(phi^-1), -phi^-1]]";
    }

    parse(structure) {
        var groups = [];
        var pointer = 0;

        console.log(JSON.stringify(groups));
        return groups;
    }

    loadPattern(instructions) {
        for (var instruction of instructions) {
            var anyons = (instruction[0] === "R") ? [2, 3] : [1, 2];
            if (instruction[1] < 0) {
                anyons = anyons.reverse();
            }
            for (var i = 0; i < Math.abs(instruction[1]); i++) {
                this.weave(anyons[0], anyons[1]);
            }
        }
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
        // update y positions
        var save = anyon1.y;
        anyon1.y = anyon2.y;
        anyon2.y = save;
        this.anyons[this.steps][pos1] = anyon2;
        this.anyons[this.steps][pos2] = anyon1;
    }

    generateD3() {
        // generate nodes
        for (var x = 0; x <= this.steps; x++) {
            for (var y = 0; y < this.size; y++) {
                nodes.push({x:x, y:y});
            }
        }

        // generate links
        for (y = 0; y < this.size; y++) {
            var values = [];
            // combine histories by slice
            var history = this.anyons[0][y].history;
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
            var lastPos = this.anyons[this.size];
            links.push({
                id: y,
                chargeStart: this.anyons[0][y].charge,
                chargeEnd: lastPos[lastPos[y].y].charge,
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
var idGate = [
    ["B", 3],["R", -2],["B", -4],["R", 2],["B", 4],["R", 2],["B", -2],["R", -2],["B", -4],["R", -4],
    ["B", -2],["R", 4],["B", 2],["R", -2],["B", 2],["R", 2],["B", -2],["R", 3]
];
var notGate = [
    ["R", -2],["B", -4],["R", 4],["B", -2],["R", 2],["B", 2],["R", -2],["B", 4],["R", -2],["B", 4],
    ["R", -2],["B", 4],["R", 2],["B", -4],["R", 2],["B", -2],["R", 2],["B", -2],["R", -2]
];

// tree structure of anyons
var idStructure = [[-1,-1],[1,[1,1]]];
var notStructure = [[1,[-1,1]]];

// initialize braid
var nodes = [];
var links = [];
var instructions = idGate;
var braid = new Braid(idStructure);
braid.loadPattern(idGate);
braid.generateD3();


//--------------------------MATRIX----------------------------------------------
var pretty = document.getElementById("pretty");
var result = document.getElementById("result");
var Fmatrix = "[[phi^-1, sqrt(phi^-1)], [sqrt(phi^-1), -phi^-1]]";
var R1matrix = "[[e^(-4*i*pi/5), 0], [0, -e^(-2*i*pi/5)]]";
var R2matrix = "[[e^(4*i*pi/5), 0], [0, -e^(2*i*pi/5)]]";
var B1matrix = "[[-tau *e^(-4*i*pi/5), -i*sqrt(tau)e^(-i*pi/10)], [-i*sqrt(tau)e^(-i*pi/10), -tau]]";
var B2matrix = "[[(-(-1)^4/5)/(tau+(-1)^3/5), 0], [0, -e^(2*i*pi/5)]]";
pretty.innerHTML = "$$" + math.parse("FR = " + Fmatrix + " * " + B2matrix).toTex() + "$$";
result.innerHTML = math.format(math.eval(Fmatrix + " * " + B1matrix));

//--------------------------D3--------------------------------------------------
var svg = d3.select("svg");
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

//Draw the groups ellipses
// TODO: compute ellipses from structure
var ellipses = [
    { cx: - margin.left / 2,        cy: 3,   rx: 1,   ry: 1.4 },
    { cx: - margin.left / 2,        cy: 0.5, rx: 0.8, ry: 0.9 },
    { cx: - margin.left / 2,        cy: 3.5, rx: 0.8, ry: 0.9 },
    { cx: width + margin.right / 2, cy: 3,   rx: 1,   ry: 1.4 },
    { cx: width + margin.right / 2, cy: 0.5, rx: 0.8, ry: 0.9 },
    { cx: width + margin.right / 2, cy: 3.5, rx: 0.8, ry: 0.9 },
];
g.selectAll(".ellipse")
    .data(ellipses)
    .enter().append("ellipse")
    .attr("cx", function(d) { return d.cx;    })
    .attr("cy", function(d) { return y(d.cy); })
    .attr("rx", function(d) { return x(d.rx); })
    .attr("ry", function(d) { return y(d.ry); })
    .style("stroke", "grey")
    .style("stroke-width", "3");

// Add the ellipses anyons
// TODO: generate anyons from structure
g.selectAll(".anyons")
    .data(links)
    .enter().append("circle")
    .attr("r", 6)
    .attr("cx", function(d) { return - margin.left / 2; })
    .attr("cy", function(d) { return y(d.id); })
    .style("fill", function(d) { return (d.chargeStart === "T") ? "dimgrey" : "white"; });
g.selectAll(".anyons")
    .data(links)
    .enter().append("circle")
    .attr("r", 6)
    .attr("cx", function(d) { return width + margin.right / 2; })
    .attr("cy", function(d) { return y(d.id); })
    .style("fill", function(d) { return (d.chargeEnd === "T") ? "dimgrey" : "white"; });

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

// Add the matrix operations text
var sum = 0;
g.selectAll(".text")
    .data(instructions)
    .enter().append("text")
    .attr("x", function(d) {
        var val = Math.abs(d[1]);
        sum += val;
        return x(sum - val / 2);
    })
    .attr("y", function(d) {
        return (d[0] === "B") ? 25 : 150;
    })
    .style("text-anchor", "middle")
    .text(function(d) { return d[0] + d[1]; });
