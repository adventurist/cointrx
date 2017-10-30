Date.prototype.getShort = function(){
    return (this.getMonth() + 1) +
        "/" +  this.getDate() +
        " " +  this.getHours() + ":" + this.getMinutes();
};

const TRXDATA = function() {
    let data, rates;

    const init = function (Args) {
        data = Args;
    }

};

const settings = {
    exchangeUrl: 'https://api.fixer.io/latest?symbols=USD,GBP,JPY,THB,ISK,CAD,DKK,EUR,RUB,CNY,INR,AUD,HKD,CHF,BRL,SGD,CLP,TWD,KRW,PLN,NZD,SEK',
    localUrl: 'http://127.0.0.1:6969',
    liveUrl: 'https://app.cointrx.com'
};

window.onload = function() {


    let initData = JSON.parse(TRXDATA.data.replace(/'/g, '"'));
    TRXDATA.rates = {};
    let data = [];

    initData.forEach(function(d) {
        let rate = Math.round(d.last * 100) / 100;
        data.push({
                'last': Math.round(d.last * 100) / 100,
                'currency' : d.currency
            });
        TRXDATA.rates[d.currency] = rate;
    });
    TRXDATA.data = data;
    convertToEu(data);

    currencyFilterListen();
    // dateListeners();
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
        ajax.open(this.method, this.url, this.async);
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

function requestGraph(url, data, massageFn, graphFn) {
    let request = new httpRequest();
    request.method = "GET";
    request.url = url;

    let convertedData = [];

    request.success = function(response) {
        let responseData = JSON.parse(response);

        if (responseData.base !== undefined && responseData.rates !== undefined) {
            TRXDATA.rates = responseData.rates;
        }

        convertedData = massageFn(responseData, convertedData, data);

        graphFn(convertedData);

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
    requestGraph(settings.exchangeUrl, data, convertAllCurrenciesEur, createGraph);
}

function createGraph(data) {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    let y = d3.scaleLinear()
        .range([height, 0]);

    let svg = d3.select("#trx-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    let lastMax = d3.max(data, d => d.last);
    x.domain(data.map(function(d) { return d.currency; }));
    y.domain([lastMax * 0.78, lastMax]);

    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>" + d.currency + " @</strong>$<span style='color:red'>" + d.last + " EUR</span>";
        });

    let bar = svg.selectAll(".bar");

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
        .on('mouseout blur', tip.hide);


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

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

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
    if (TRXDATA.data !== null) {
        clearSvg();
        requestGraph(settings.liveUrl + '/prices/graph/currency?currency=' + lang, TRXDATA.data, convertCurrencyToEur, currencyGraphHistory);
    }
}

function clearSvg() {
    d3.selectAll('svg').remove();
}

// function getHistoryData(url, data) {
//     let request = new httpRequest();
//     request.method = "GET";
//     request.url = url;
//
//     request.success = function(response) {
//         let responseData = JSON.parse(response);
//
//         if (responseData != null) {
//             console.dir(responseData);
//             exchangeOneCurrency(settings.exchangeUrl, responseData);
//         } else {
//             return null;
//         }
//     };
//
//
//     request.fail = function(error) {
//         let err = new Error();
//         console.log(err.stack);
//         console.error(error);
//     };
//
//     request.send();
// }

function currencyGraphHistory(initData) {

    let timeFormat = d3.timeFormat("%I:%M %p %a %Y");

    data = [];
    console.dir(initData);

    initData.forEach(function(d) {
        data.push({
            'last': Math.round(d.last * 100) / 100,
            'currency' : d.currency,
            'rid': d.rid,
            'timestamp': d.modified,
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
    // y.domain(data.map(function(d) { return d.last; }));
    // // x.domain([d3.max(data, function(d) { return d.timestamp/1500000000 }), d3.max(data, function(d) { return d.timestamp/1500000000 * 2})]);
    // x.domain(data.map(function(d) { return d.rid;}));

    let lastMax = d3.max(data, d => d.last);
    x.domain(data.map(d => d.timestamp));
    y.domain([lastMax * 0.78, lastMax]);

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
        .attr("x", function(d) { return x(d.timestamp); })
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
        .attr("x", function(d) { return x(d.timestamp); })
        .attr("y", function(d) { return y(d.last / 1.2);})
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
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

    d3.selectAll('rect.bar').each(function() {
        this.setAttribute('tabindex', 0);
    });

    // let xRange = d3.scaleTime().range([0, width]);
    //
    // let xAxis = d3.axisBottom(xRange)
    //     .tickFormat(d3.timeFormat("%Y-%m-%d"));

    //console.dir(xAxis)
    let ticks = d3.selectAll('.tick text');

    ticks.attr('class', function(d, i) {
        return d > 10000 ? 'timestamp' : 'price';
    });
    formatDates()
}

function exchangeOneCurrency(url, data) {
    let request = new httpRequest();
    request.method = "GET";
    request.url = url;

    let convertedData = [];

    request.success = function (response) {
        let responseData = JSON.parse(response);

        if (Object.keys(data) != 'EUR') {
            for (let c in responseData.rates) {
                data[Object.keys(data)[0]].forEach(function (d) {
                    if (c == d.currency) {
                        convertedData.push({
                            rid: d.rid,
                            currency: d.currency,
                            modified: d.modified,
                            last: Math.round(d.last / responseData.rates[c] * 100) / 100
                        });
                    }
                })
            }
        } else {
            convertedData = data[Object.keys(data)[0]];
        }
        currencyGraphHistory(convertedData);
        return responseData;
    };

    request.fail = function(error) {
        let err = new Error();
        console.log(err.stack);
        console.error(error);
    };

    request.send();
}

function convertCurrencyToEur (responseData, convertedData, data) {
    if (Object.keys(responseData) != 'EUR') {
        for (let c in responseData) {
            responseData[c].forEach(function (d) {
                if (c == d.currency) {
                    convertedData.push({
                        rid: d.rid,
                        currency: d.currency,
                        modified: d.modified,
                        // last: Math.round(d.last / responseData[c] * 100) / 100,
                        last: Math.round(d.last / TRXDATA.rates[c] * 100) / 100
                    });
                }
            })
        }
    } else {
        convertedData = responseData[Object.keys(responseData)[0]];
    }
    return convertedData !== undefined ? convertedData.reverse() : null;
}

function convertAllCurrenciesEur(responseData, convertedData, data) {
    for (let c in responseData.rates) {
        data.forEach(function(d) {
            if (c == d.currency) {
                convertedData.push({currency: d.currency, last: Math.round(d.last / responseData.rates[c] * 100) / 100});
            }
        })
    }
    return convertedData;
}


function formatDates() {
    let ticks = Array.from(document.querySelectorAll('#trx-graph text.timestamp'));

    ticks.forEach(function (t) {
        let replacement = new Date(t.innerHTML * 1000);

        t.innerHTML = replacement.getShort();
    });
}