

function cycleGraphE() {
    var gs = document.getElementById('graphs')
    gs.removeChild(gs.childNodes[0]);

    var g = document.createElement('span');
    g.id = 'graph';
    gs.appendChild(g);
}

function getRDag() {

    // Make a request for a rule DAG
    axios.get('/rules')
        .then(function (response) {
            console.log(response);
            const digraph1 = response.data;

            //cycleGraphE();
            gRender(digraph1);

        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () { });
}

function getFDag() {

    // Make a request for a file DAG
    axios.get('/files')
        .then(function (response) {
            console.log(response);
            var digraph1 = response.data;

            cycleGraphE();
            gRender(digraph1);

        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () { });
}

function getRule(ruleName) {

    // Make a request for a rule DAG
    this.axios.get('/rule?name=' + ruleName)
        .then(function (response) {
            console.log(response);
            document.getElementById('rulemodaltitle').innerHTML = ruleName;
            document.getElementById('rulemodalbody').innerHTML = response.data;
        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () { });
}

function gRender(digraph) {

    const transition = d3.transition()
        .delay(100)
        .duration(1000);

        var graphviz = d3.select("#graph").graphviz();
            graphviz.on("end", function(){

                var dotSrcLines = digraph.split('\n');
                nodes = d3.selectAll('.node,.edge');
                nodes.on("click", function () {
                    var title = d3.select(this).selectAll('title').text().trim();
                    var text = d3.select(this).selectAll('text').text();

                    console.log("Fetching : ", text);
                    getRule(text);
                    $('#rulemodal').modal({keyboard: true});
                 });
             });
             graphviz.transition(transition)
                    .renderDot(digraph);
}



