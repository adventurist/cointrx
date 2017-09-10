console.log('this is getting called');

var TRXDATA = function() {
    let data;
    const init = function (Args) {
        console.dir(Args);
        data = Args;

    }
};

window.onload = function() {

let dataWorking = [
    {currency: 'Bob', last: 33 },
    {currency: 'Robin' ,last: 12 },
    {currency: 'Anne', last: 41 },
    {currency: 'Mark', last: 16 }
];

    // let initData = JSON.parse(TRXDATA.data.replace(/'/g, '"'));
    //
    // let data = [];
    // let currencies = [];
    //
    // initData.forEach(function(d) {
    //     data.push(
    //         {
    //             // 'last': parseFloat(d.last).toFixed(2),
    //             'last': Math.round(d.last * 100) / 100 / 100,
    //             'currency' : d.currency
    //         });
    // });
    //




    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

// set the ranges
    var x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    var y = d3.scaleLinear()
        .range([height, 0]);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
    var svg = d3.select("#d3-test").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// get the data
//     d3.csv("sales.csv", function(error, data) {
//         if (error) throw error;

        // format the data
        // data.forEach(function(d) {
        //     d.sales = +d.sales;
        // });

        // Scale the range of the data in the domains
        x.domain(dataWorking.map(function(d) { return d.currency; }));
        y.domain([0, d3.max(dataWorking, function(d) { return d.last; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
            .data(dataWorking)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.name); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(d.last); })
            .attr("height", function(d) { return height - y(d.last); });

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

    // });

























//     let initData = JSON.parse(TRXDATA.data.replace(/'/g, '"'));
//
//     let data = [];
//     let currencies = [];
//
//     initData.forEach(function(d) {
//         data.push(
//             {
//                 // 'last': parseFloat(d.last).toFixed(2),
//                 'last': Math.round(d.last * 100) / 100,
//                 'currency' : d.currency
//             });
//     });
//
//
//     let svg = d3.select("#trx-graph"),
//         margin = {top: 20, right: 20, bottom: 30, left: 50},
//         width = +svg.attr("width") - margin.left - margin.right,
//         height = +svg.attr("height") - margin.top - margin.bottom,
//         g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//     let formatPercent = d3.format(".0%");
//
//     let xScale = d3.scaleTime()
//         .domain([new Date(1910, 0, 1), (new Date(2010, 0, 1))])
//         .range([0, 500]);
//
//     let xAxis = d3.axisBottom(xScale);
//
//     let yScale = d3.scaleLinear()
//         .domain([0, 10000])
//         .range([250, 0]);
//
//     let yAxis = d3.axisLeft(yScale);
//
//     let parseTime = d3.timeParse("%d-%b-%y");
//
//     let x = d3.scaleTime()
//         .rangeRound([0, width]);
//
//     let y = d3.scaleLinear()
//         .rangeRound([height, 0]);
//
//     let line = d3.line()
//         .x(function(d) {
//             let muhD = d;
//             return x(d.date); })
//         .y(function(d) {
//             let muhD = d;
//
//             return y(d.close); });
//
//
//     x.domain(currencies.map(function(c) { return c; }));
//     y.domain([0, d3.max(data, function(d) { return d.last; })]);
//
//
//     drawMainGraph();
//
//     function drawMainGraph() {
//
//         var valueline = d3.line()
//             .x(function(d) { return x(d.date); })
//             .y(function(d) { return y(d.close); });
//
//         let line = d3.line()
//             .curve(d3.scaleLinear())
//             .x(function (d) {
//                 return x(dateFormat.parse(d.key))
//             })
//             .y(function (d) {
//                 return y(d.values.length)
//             });
//
//         x.domain(d3.extent(data, function (d) {
//             return new Date(d.time)
//         }));
//         y.domain([0, d3.max(data, function (d) { console.dir(this);
//         console.dir(data);
//         console.dir(d);
//             return d.currency;
//         })]);
//
//         svg.append("g")
//             .attr("class", "grid")
//             .attr("transform", "translate(0," + height + ")")
//             .call(make_x_gridlines()
//                 .tickSize(height)
//                 .tickFormat("")
//             )
//
//         // add the Y gridlines
//         svg.append("g")
//             .attr("class", "grid")
//             .call(make_y_gridlines()
//                 .tickSize(width)
//                 .tickFormat("")
//             )
//         let datacheck = data;
//         console.dir(datacheck);
//         // add the valueline path.
//         svg.append("path")
//             .data([data])
//             .attr("class", "line")
//             .attr("d", valueline);
//
//         // add the X Axis
//         svg.append("g")
//             .attr("transform", "translate(0," + height + ")")
//             .call(d3.axisBottom(x));
//
//         // add the Y Axis
//         svg.append("g")
//             .call(d3.axisLeft(y));
//
//
//         // gridlines in x axis function
//         function make_x_gridlines() {
//             return d3.axisBottom(xScale)
//                 .ticks(5)
//         }
//
// // gridlines in y axis function
//         function make_y_gridlines() {
//             return d3.axisLeft(yScale)
//                 .ticks(5)
//         }
//
//
//
//         // svg.append("g")
//         //     .attr("class", "x axis")
//         //     .attr("transform", "translate(0," + height + ")")
//         //     .call(xAxis);
//         //
//         // svg.append("g")
//         //     .attr("class", "y axis")
//         //     .call(yAxis)
//         //     .append("text")
//         //     .attr("transform", "rotate(-90)")
//         //     .attr("y", 6)
//         //     .attr("dy", ".71em")
//         //     .style("text-anchor", "end")
//         //     .text("Count");
//         //
//         // svg.selectAll(".bar")
//         //     .data(data)
//         //     .enter().append("rect")
//         //     .attr("class", "bar")
//         //     .attr("x", function(d) { return x('Test'); })
//         //     .attr("width", function(d) { return width - x(d)})
//         //     .attr("y", function(d) { return y(d); })
//         //     .attr("height", function(d) { return height - y(d); });
//             // .on('mouseover', tip.show)
//             // .on('mouseout', tip.hide)
//
//     }
//
//         // d3.json()
//     // d3.tsv("data.tsv", function(d) {
//     //     d.date = parseTime(d.date);
//     //     d.close = +d.close;
//     //     return d;
//     // }, function(error, data) {
//     //     if (error) throw error;
//     //
//     //     x.domain(d3.extent(data, function(d) { return d.date; }));
//     //     y.domain(d3.extent(data, function(d) { return d.close; }));
//     //
//     //     g.append("g")
//     //         .attr("transform", "translate(0," + height + ")")
//     //         .call(d3.axisBottom(x))
//     //         .select(".domain")
//     //         .remove();
//     //
//     //     g.append("g")
//     //         .call(d3.axisLeft(y))
//     //         .append("text")
//     //         .attr("fill", "#000")
//     //         .attr("transform", "rotate(-90)")
//     //         .attr("y", 6)
//     //         .attr("dy", "0.71em")
//     //         .attr("text-anchor", "end")
//     //         .text("Price ($)");
//     //
//     //     g.append("path")
//     //         .datum(data)
//     //         .attr("fill", "none")
//     //         .attr("stroke", "steelblue")
//     //         .attr("stroke-linejoin", "round")
//     //         .attr("stroke-linecap", "round")
//     //         .attr("stroke-width", 1.5)
//     //         .attr("d", line);
//     // });
//
//
//
//
//
//
//
//
//
//
//
//     // let labels, key, rows = data || [];
//     //
//     // let p = [10, 50, 70, 50],
//     //     w = 550 - p[1] - p[3],
//     //     h = 250;
//     //
//     // let chartData = key.map(function(value,index) {
//     //     return rows.map(function(d,i) {
//     //         labels[i] = d[0];
//     //         return {x: i, y: + d[index + 1], index: index};
//     //     });
//     // });
//     //
//     // let x = d3.scale.linear().domain([0,rows.length - 1]).range([20,chart.w]),
//     //     y = d3.scale.linear().domain([0,maxValue(rows)]).range([chart.h, 0]),
//     //     z = d3.scale.ordinal().range(["blue", "red", "orange", "purple", "green"]);
//     //
//     // var svg = d3.select('#trx-graph')
//     //     .attr("width", 400)
//     //     .attr("height", 200)
//     //     .attr("class", 'container')
//     //     .append("g")
//     //
//     // let graph = svg.append("g")
//     //     .attr("class", "chart")
//     //     .attr('height', chart.h)
//     //     .attr("transform", "translate(" + p[3] + "," + p[0] + ")");
//     //
//     // let tooltip = d3.select("#visualization")
//     //     .append("div")
//     //     .style("position", "absolute")
//     //     .style("z-index", "10")
//     //     .style("visibility", "hidden")
//     //     .text("a simple tooltip");
//     //
//     // graph.selectAll("path.line")
//     //     .data(data)
//     //     .enter().append("path")
//     //     .attr("class", "line")
//     //     .style("stroke", function(d, i) { return d3.rgb(z(i)); })
//     //     .style("stroke-width", 3)
//     //     .attr("d", d3.svg.line()
//     //         .x(function(d,i) { return x(i); })
//     //         .y(function(d) { return y(d.y); }))
//     //     .on('mouseover', function() {return 'jigga';});
//
//     console.dir(data);
//     // console.dir(chartData);

};


