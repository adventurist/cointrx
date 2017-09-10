let bar = svg.selectAll(".bar");

bar.data(data)
    .enter()

    .append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * height - y(d.last) * 1.1 + ")"; })

    .append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.currency); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.last); })
    .attr("height", function(d) { return height - y(d.last) * 1.1; })
    .attr('tabindex', 1)
    .on('mouseover focus', tip.show)
    .on('mouseout blur', tip.hide)
    .append("text")
    .attr("x", function(d) { return x(d) - 3; })
    .attr("y", (height - y(d.last) * 1.1) / 2)
    .attr("dy", ".35em")
    .text(function(d) { return d; })

;