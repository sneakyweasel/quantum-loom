/* global $, document, _, d3 */
//--------------------------ANYONS----------------------------------------------
class Anyon {
    constructor(id, y, charge) {
        this.id = id;
        this.y = y;
        this.z = 1;
        this.history = [];
        this.charge = charge;
    }

    fusion(anyon) {
        // fusion for trivial value 1 (0 in binary)
        if (this.value === "1" && anyon.value === "1") {
            return "1";
        } else if (this.value === "1" && anyon.value === "T") {
            return "T";
        } else if (this.value === "T" && anyon.value === "1") {
            return "T";
        } else {
            return "1|T";
        }
    }

    debug() {
        console.log(`ID: ${this.id} - Y POS: ${this.y} - ZINDEX: ${this.z} - ${this.history}`);
    }
}


//--------------------------BRAID-----------------------------------------------
class Braid {
    constructor(structure) {
        this.structure = structure;
        this.size = this.parse(structure).length;
        this.steps = 0;
        this.anyons = new Array(1);
        this.anyons[0] = [];
        var element = this.parse(structure);
        for (var i = 0; i < this.size; i++) {
            var charge = (element[i] > 0) ? "T" : "1";
            this.anyons[0].push(new Anyon(i, i, charge));
        }
    }

    parse(structure) {
        const flatten = arr => arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);
        return flatten(structure);
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
        // cross
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
var idGate = [
    ["B", 3],["R", -2],["B", -4],["R", 2],["B", 4],["R", 2],["B", -2],["R", -2],["B", -4],["R", -4],
    ["B", -2],["R", 4],["B", 2],["R", -2],["B", 2],["R", 2],["B", -2],["R", 3]
];
var notGate = [
    ["R", -2],["B", -4],["R", 4],["B", -2],["R", 2],["B", 2],["R", -2],["B", 4],["R", -2],["B", 4],
    ["R", -2],["B", 4],["R", 2],["B", -4],["R", 2],["B", -2],["R", 2],["B", -2],["R", -2]
];
var idStructure = [[-1,-1],[1,[1,1]]];
var notStructure = [[1,[-1,1]]];

// initialize braid
var nodes = [];
var links = [];
var instructions = idGate;
var braid = new Braid(idStructure);
braid.loadPattern(idGate);
braid.generateD3();


//--------------------------D3--------------------------------------------------
var svg = d3.select("svg");
var margin = {
    top: 20,
    right: 80,
    bottom: 20,
    left: 80
};
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
    .text(function(d) { return d[0]+d[1]; });

// Weave the paths
for (var step = 1; step < links[0].values.length; step++) {
    var slices = [];
    for (var i = 0; i < links.length; i++) {
        slices.push([links[i].values[step-1], links[i].values[step]]);
    }
    // Ordering render
    slices.sort(function (a, b) {
        return a[0].z - b[0].z;
    });
    for (i = 0; i < slices.length; i++) {
        g.append("path")
          .attr("class", "line")
          .attr("d", function(d) {
              return line(slices[i]);
          })
          .style("stroke", function(d) {
              return z(slices[i][1].id);
          })
          .style("z-index", function(d) {
              return slices[i][1].z;
          })
          .style("stroke-width", 4)
          .on("mouseover", function(d) {
              d3.select(this).style("stroke-width", "10");
          })
          .on("mouseout", function(d) {
              d3.select(this).style("stroke-width", "5");
          });
    }
}
