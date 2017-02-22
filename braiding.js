/* global $, document, _, d3 */
//--------------------------ANYONS----------------------------------------------
class Anyon {
    constructor(id, y, value) {
        this.id = id;
        this.y = y;
        this.history = [];
        this.value = value;
    }

    debug() {
        console.log(`ID: ${this.id} - Y POS: ${this.y} - ${this.history}`);
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

    processFormula(formula) {

    }
}


//--------------------------BRAID-----------------------------------------------
class Braid {
    constructor(size) {
        this.size = size;
        this.steps = 0;
        this.anyons = new Array(1);
        this.anyons[0] = [];
        for (var i = 0; i < this.size; i++) {
            this.anyons[0].push(new Anyon(i, i, "T", this));
        }
    }

    loadPattern(instructions) {
        for (var instruction of instructions) {
            var anyons = (instruction[0] === "R") ? [2, 3] : [1, 2];
            if (instructions[1] < 0) {
                anyons.reverse();
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
        // update histories
        anyon1.history.push(anyon1.y);
        anyon2.history.push(anyon2.y);
        for (var anyon of this.anyons[this.steps]) {
            if (anyon.y !== anyon1.y && anyon.y !== anyon2.y) {
                anyon.history.push(anyon.y);
            }
        }
        // cross
        var save = anyon1.y;
        anyon1.y = anyon2.y;
        anyon2.y = save;
        this.anyons[this.steps][pos1] = anyon2;
        this.anyons[this.steps][pos2] = anyon1;
    }

    debug() {
        var output = new Array(this.size);
        for (var i = 0; i < size; i++) {
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
                    y: history[x]
                });
            }
            // add current pos
            values.push({
                x: x,
                y: this.anyons[0][y].y
            });
            links.push({
                id: y,
                values: values
            });
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

// initialize braid
var size = 5;
var braid = new Braid(size);
braid.loadPattern(idGate);
braid.debug();

var instructions = idGate;
var nodes = [];
var links = [];
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
x.domain(d3.extent(nodes, function(d) {
    return d.x;
}));
y.domain([
    d3.min(nodes, function(d) {
        return d.y;
    }),
    d3.max(nodes, function(d) {
        return d.y;
    })
]);
z.domain(nodes.map(function(c) {
    return c.id;
}));

// define the line generating function
var line = d3.line()
    .x(function(d) {
        return x(d.x);
    })
    .y(function(d) {
        return y(d.y);
    })
    .curve(d3.curveMonotoneX);

// Add the nodes
g.selectAll(".dot")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 3)
    .attr("cx", function(d) {
        return x(d.x);
    })
    .attr("cy", function(d) {
        return y(d.y);
    });

//Draw the groups
g.append("ellipse")
    .attr("cx", function(d) {
        return - margin.left / 2;
    })
    .attr("cy", function(d) {
        return y(3);
    })
    .attr("rx", 20)
    .attr("ry", y(1.4))
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

g.append("ellipse")
    .attr("cx", function(d) {
        return - margin.left / 2;
    })
    .attr("cy", function(d) {
        return y(0.5);
    })
    .attr("rx", 15)
    .attr("ry", y(0.9))
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

g.append("ellipse")
    .attr("cx", function(d) {
        return - margin.left / 2;
    })
    .attr("cy", function(d) {
        return y(3.5);
    })
    .attr("rx", 15)
    .attr("ry", 35)
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

//Draw the groups
g.append("ellipse")
    .attr("cx", function(d) {
        return width + margin.right / 2;
    })
    .attr("cy", function(d) {
        return y(3);
    })
    .attr("rx", 20)
    .attr("ry", 55)
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

g.append("ellipse")
    .attr("cx", function(d) {
        return width + margin.right / 2;
    })
    .attr("cy", function(d) {
        return y(0.5);
    })
    .attr("rx", 15)
    .attr("ry", 35)
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

g.append("ellipse")
    .attr("cx", function(d) {
        return width + margin.right / 2;
    })
    .attr("cy", function(d) {
        return y(3.5);
    })
    .attr("rx", 15)
    .attr("ry", 35)
    .style("stroke", "darkgrey")
    .style("stroke-width", "3");

// Add the anyons
for (var i = 0; i < 5; i++){
    g.append("circle")
        .attr("r", 7)
        .attr("cx", function(d) {
            return - margin.left / 2;
        })
        .attr("cy", function(d) {
            return y(i);
        })
        .style("fill", "grey");
    g.append("circle")
        .attr("r", 7)
        .attr("cx", function(d) {
            return width + margin.right / 2;
        })
        .attr("cy", function(d) {
            return y(i);
        })
        .style("fill", "grey");
}

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

// Add the paths
// TODO: include z-index
var link = g.selectAll(".link")
    .data(links)
    .enter().append("g")
    .attr("class", "link");

link.append("path")
    .attr("class", "line")
    .attr("d", function(d) {
        return line(d.values);
    })
    .style("stroke", function(d) {
        return z(d.id);
    })
    .style("stroke-width", 4)
    .on("mouseover", function(d) {
        d3.select(this).style("stroke-width", "10");
    })
    .on("mouseout", function(d) {
        d3.select(this).style("stroke-width", "5");
    });
