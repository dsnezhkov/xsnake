
// Ace
var editor = ace.edit("editor");
editor.setOptions({
    theme: "ace/theme/textmate",
});
editor.session.setMode("ace/mode/python");
editor.setKeyboardHandler("ace/keyboard/vim");


document.getElementById ("fDag").addEventListener ("click", getFDag, false);
document.getElementById ("fDag").addEventListener ("click", getFDag, false);
document.getElementById ("rDag").addEventListener ("click", getRDag, false);
document.getElementById ("wfedit").addEventListener ("click", getWfContent.bind(null,"WorkflowName"), false);



// Search Workflow buttom
$('#workflowSrch').click(function() {
  const workflowName = $("#workflowSrchIn").val() ;
  getWfContent(workflowName);
  getWTree(workflowName);
  getRDag();
});

// DAGs
function cycleGraphE() {
    var gs = document.getElementById('graphs')
    gs.removeChild(gs.childNodes[0]);

    var g = document.createElement('span');
    g.id = 'graph';
    gs.appendChild(g);
}
function getWTree(wfName) {

    $('#wtree').jstree({
        'core' : {
            'animation' : 0,
            'data' : {
                "url" : "/wtree?wf=Workflow",
                "dataType" : "json" // needed only if you do not supply JSON headers
            }
        }
    }).on("changed.jstree", function (e, data) {
        if ( data.selected[0].startsWith("XS") ){
            console.log(data.selected);
            getExposedContent(wfName,  data.selected[0] )
        }
    });
}

function getExposedContent(wfName, resourceId) {

    // Make a request for a exposed identifier
    this.axios.get('/econtent?wf=' + wfName + '&' + 'rid=' + resourceId)
        .then(function (response) {
            console.log(response);
            wfObj = JSON.parse(response.data);

            console.log(wfObj);
            if (wfObj.success  === false){
                console.log("success false");
                document.getElementById('rulemodaltitle').innerHTML = wfName;
                document.getElementById('rulemodalbody').innerHTML =  wfObj.message;
                $('#rulemodal').modal({keyboard: true});
            }else{
                editor.insert(wfObj.content);
            }
        })
        .catch(function (error) {
            console.log(error);

            document.getElementById('rulemodaltitle').innerHTML = wfName;
            document.getElementById('rulemodalbody').innerHTML =  error.message;
            $('#rulemodal').modal({keyboard: true});
        })
        .finally(function () { });
}

function getWfContent(wfName) {

    // Make a request for a rule DAG
    this.axios.get('/wfcontent?wf=' + wfName)
        .then(function (response) {
            console.log(response);
            wfObj = JSON.parse(response.data);

            console.log(wfObj);
            if (wfObj.success  === false){
                console.log("success false");
                document.getElementById('rulemodaltitle').innerHTML = wfName;
                document.getElementById('rulemodalbody').innerHTML =  wfObj.message;
                $('#rulemodal').modal({keyboard: true});
            }else{
                editor.insert(wfObj.content);
            }
        })
        .catch(function (error) {
            console.log(error);

            document.getElementById('rulemodaltitle').innerHTML = wfName;
            document.getElementById('rulemodalbody').innerHTML =  error.message;
            $('#rulemodal').modal({keyboard: true});
        })
        .finally(function () { });
}

function getRDag() {

    // Make a request for a rule DAG
    axios.get('/rules')
        .then(function (response) {
            console.log(response);
            const digraph1 = response.data;

            cycleGraphE();
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

    /* Find in WF editor
    editor.find(ruleName,{
        backwards: false,
        wrap: false,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    });
    */

    // Make a request for a rule DAG
    this.axios.get('/rule?name=' + ruleName)
        .then(function (response) {
            console.log(response);
            ruleLocation = JSON.parse(response.data);
            console.log(ruleLocation);

            if (ruleLocation.success  === false){
                console.log("success false");
                document.getElementById('rulemodaltitle').innerHTML = ruleName;
                document.getElementById('rulemodalbody').innerHTML =  ruleLocation.message;
                $('#rulemodal').modal({keyboard: true});
            }else{
                editor.scrollToLine(ruleLocation);
                editor.gotoLine(ruleLocation.content);
            }
        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () { });
}

function gRender(digraph) {

    const transition = d3.transition()
        .delay(0)
        .duration(500);

        var graphviz = d3.select("#graph").graphviz();
            graphviz.on("end", function(){

                var dotSrcLines = digraph.split('\n');
                nodes = d3.selectAll('.node,.edge');
                nodes.on("click", function () {
                    var title = d3.select(this).selectAll('title').text().trim();
                    var text = d3.select(this).selectAll('text').text();

                    getRule(text);
                 });
             });
             graphviz.transition(transition)
                    .renderDot(digraph);
}



