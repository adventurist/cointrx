const TRXDATA = function() {
    let data;

    const init = function (Args) {
        data = Args;
    }

};

const settings = {
    exchangeUrl: 'http://api.fixer.io/latest?symbols=USD,GBP,JPY,THB,ISK,CAD,DKK,EUR,RUB,CNY,INR,AUD,HKD,CHF,BRL,SGD,CLP,TWD,KRW,PLN,NZD,SEK'
};

window.onload = function() {


    let initData = JSON.parse(TRXDATA.data.replace(/'/g, '"'));
    let data = [];

    initData.forEach(function(d) {
        data.push({
                'last': Math.round(d.last * 100) / 100,
                'currency' : d.currency
            });
    });
    convertToEu(data);

    currencyFilterListen();
};

function httpRequest() {
    let ajax = null,
        response = null,
        self = this;

    this.method = null;
    this.url = null;
    this.async = true;
    this.data = null;

    this.send = function() {
        ajax.open(this.method, this.url, this.asnyc);
        ajax.send(this.data);
    };

    if (window.XMLHttpRequest) {
        ajax = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        try {
            ajax = new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch(e) {
            try {
                ajax = new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch(ee) {
                self.fail("not supported");
            }
        }
    }

    if (ajax == null) {
        return false;
    }

    ajax.onreadystatechange = function() {
        if(this.readyState == 4) {
            if(this.status == 200) {
                self.success(this.responseText);
            } else {
                self.fail(this.status + " - " + this.statusText);
            }
        }
    };
}

function exchangeService(url, data) {
    let request = new httpRequest();
    request.method = "GET";
    request.url = url;

    let convertedData = [];

    request.success = function(response) {
        let responseData = JSON.parse(response);

        if (responseData.rates) {

            for (let c in responseData.rates) {
                data.forEach(function(d) {
                    if (c == d.currency) {
                        convertedData.push({currency: d.currency, last: Math.round(d.last / responseData.rates[c] * 100) / 100});
                    }
                })
            }
            createGraph(convertedData);
        }
        return responseData;
    };


    request.fail = function(error) {
        let err = new Error();
        console.log(err.stack);
        console.error(error);
    };

    request.send();
}
function convertToEu(data) {
    exchangeService(settings.exchangeUrl, data);
}

function createGraph(data) {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

// set the ranges
    let x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    let y = d3.scaleLinear()
        .range([height, 0]);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
    let svg = d3.select("#trx-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    console.dir(data);
    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d.currency; }));
    y.domain([1200, d3.max(data, function(d) { return d.last; })]);

    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>" + d.currency + " @</strong>$<span style='color:red'>" + d.last + " EUR</span>";
        });

    // append the rectangles for the bar chart
    let bar = svg.selectAll(".bar");
    console.dir(data);
    bar.data(data)
        .enter()
        .append("g")
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.currency); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.last); })
        .attr("height", function(d) { return height - y(d.last) * 1.1; })
        .attr('tabindex', 1)
        .on('mouseover focus', tip.show)
        .on('mouseout blur', tip.hide)

        // .append("text")
        // .text(function(d) {
        //     return d.last;
        // })
        ;
    // bar.exit().remove();


    let text = svg.selectAll("text")
        .data(data).enter()
        .append("text")
        .attr("class","text");

    text
        .attr("text-anchor", "center")
        .attr("x", function(d) { return x(d.currency); })
        .attr("y", function(d) { return y(d.last / 1.2);})
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("stroke-width", "1.5px")
        .attr("stroke", "#c6bcd0")
        .attr("fill", "#c6bcd0")
        .text(function(d) {
            return d.last;
        });

    text.exit().remove();
    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.call(tip);

    d3.selectAll('rec.bar').each(function() {
        this.setAttribute('tabindex', 0);
    })

}

function currencyFilterListen() {
    let details = document.querySelectorAll('.graph-item');

    for (let d = 0; d < details.length; d++) {
        details[d].addEventListener('click', function(e) {
            let choice = e.srcElement.innerText;

            if (choice != null) {
                currencyFilter(choice);
            }


        })
    }

}

function currencyFilter(lang) {
    clearSvg();
    getHistoryData('http://cointrx.com:6969/prices/graph/currency?currency=' + lang);
}

function clearSvg() {
    d3.selectAll('svg').remove();
}

function getHistoryData(url, data) {
    let request = new httpRequest();
    request.method = "GET";
    request.url = url;

    request.success = function(response) {
        let responseData = JSON.parse(response);

        if (responseData != null) {
            console.dir(responseData);
            currencyGraphHistory(responseData);
        } else {
            return null;
        }
    };


    request.fail = function(error) {
        let err = new Error();
        console.log(err.stack);
        console.error(error);
    };

    request.send();
}

function currencyGraphHistory(initData) {

    data = [];
    console.dir(initData);

    initData[Object.keys(initData)[0]].forEach(function(d) {
        data.push({
            'last': Math.round(d.last * 100) / 100,
            'currency' : d.currency,
            'rid': d.rid
        });
    });

    let margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

// set the ranges
    let x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    let y = d3.scaleLinear()
        .range([height, 0]);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
    let svg = d3.select("#trx-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    console.dir(data);
    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d.currency; }));
    y.domain([0, d3.max(data, function(d) { return d.rid })]);

    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>" + d.currency + " @</strong>$<span style='color:red'>" + d.last + " EUR</span>";
        });

    // append the rectangles for the bar chart
    let bar = svg.selectAll(".bar");
    console.dir(data);
    bar.data(data)
        .enter()
        .append("g")
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.currency); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.last); })
        .attr("height", function(d) { return height - y(d.last) * 1.1; })
        .attr('tabindex', 1)
        .on('mouseover focus', tip.show)
        .on('mouseout blur', tip.hide)

    // .append("text")
    // .text(function(d) {
    //     return d.last;
    // })
    ;
    // bar.exit().remove();


    let text = svg.selectAll("text")
        .data(data).enter()
        .append("text")
        .attr("class","text");

    text
        .attr("text-anchor", "center")
        .attr("x", function(d) { return x(d.currency); })
        .attr("y", function(d) { return y(d.last / 1.2);})
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("stroke-width", "1.5px")
        .attr("stroke", "#c6bcd0")
        .attr("fill", "#c6bcd0")
        .text(function(d) {
            return d.last;
        });

    text.exit().remove();
    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.call(tip);

    d3.selectAll('rec.bar').each(function() {
        this.setAttribute('tabindex', 0);
    })

}