/* global $, document, _, d3 */
//--------------------------ANYONS----------------------------------------------
class Anyon {
    constructor(id, y, value) {
        this.id = id;
        this.y = y;
        this.history = [y];
        this.value = value;
    }

    debug() {
        console.log(`ID: ${this.id} - Y POS: ${this.y} - ${this.history}`);
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
            if (anyon.y !== anyon1.y && anyon.y !== anyon2.y){
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
            for (x = 0; x < history.length; x++) {
                values.push({
                    x: x,
                    y: history[x]
                });
            }
            links.push({
                id: y,
                values: values
            });
        }
        console.log(JSON.stringify(links));
    }
}


//--------------------------INIT------------------------------------------------
// initialize braid
var size = 5;
var braid = new Braid(size);
braid.weave(1, 2);
braid.weave(2, 3);
braid.weave(0, 1);
braid.weave(2, 3);
braid.weave(3, 4);
braid.weave(1, 0);
braid.debug();

var nodes = [];
var links = [];
braid.generateD3();


//--------------------------D3--------------------------------------------------
var svg = d3.select("svg");
var margin = {top: 20, right: 20, bottom: 20, left: 20};
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
    .y(function(d) { return y(d.y); });

// Add the nodes
g.selectAll(".dot")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 5)
    .attr("cx", function(d) { return x(d.x); })
    .attr("cy", function(d) { return y(d.y); });

// Add text to nodes
g.selectAll(".text")
    .data(nodes)
    .enter().append("text")
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y) - 6; })
    .style("text-anchor", "middle")
    .text(function(d) { return d.id; });


// Add the paths
var link = g.selectAll(".link")
    .data(links)
    .enter().append("g")
    .attr("class", "link");

link.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) { return z(d.id); })
    .style("stroke-width", 4);
