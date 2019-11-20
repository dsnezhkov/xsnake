// Ace Editor
var editor = ace.edit("editor");

$(document).ready(function () {

    // Ace
    editor.setOptions({
        theme: "ace/theme/textmate",
    });
    editor.session.setMode("ace/mode/python");
    editor.setKeyboardHandler("ace/keyboard/vim");


    // Workflows
    $('#fDag').bind("click", function () {
        getFDag(Cookies.get("workflow"));
    });
    $('#rDag').bind("click", function () {
        getRDag(Cookies.get("workflow"));
    });
    $('#wfDropdown').on("click", "a", function () {
        const workflowName = $(this).attr('id');
        Cookies.set('workflow', workflowName, {path: '/'});
        getWTree(workflowName);
        getWfContent(workflowName);
        getRDag(workflowName);
        $('#wnavigator').show();
    });
    $('#wtreeSrch').keyup(function (e) {
        const v = $('#wtreeSrch').val();
        console.log(v);
        $('#wtree').jstree("search", v)
    });

    // Fire Up
    getWorkflows();
});

// Functions //

// DAGs
function cycleGraphE() {
    const gs = document.getElementById('graphs')
    gs.removeChild(gs.childNodes[0]);

    const g = document.createElement('span');
    g.id = 'graph';
    gs.appendChild(g);
}

function getWTree(wfName) {
    $('#wtree').unbind().removeData();
    $('#wtree').jstree({
        'core': {
            "themes": {
                "name": "proton",
                "responsive": true,
            },
            "data": {
                "url": "/wtree?wf=" + wfName,
                "dataType": "json"
            },
        },
        "plugins": ["search"],
        "search": {
            'case_sensitive': false,
            'show_only_matches': true
        }
    }).on("changed.jstree", function (e, data) {
        if (data.selected[0].startsWith("XS")) {
            console.log(data.selected);
            getExposedContent(wfName, data.selected[0])
        }
    }).on('ready.jstree', function () {
        $(this).jstree('open_all')
    });
}

function getWorkflows() {

    // Make a request for a rule DAG
    return this.axios.get('/workflows')
        .then(function (response) {
            console.log(response);
            wfObj = JSON.parse(response.data);

            console.log(wfObj);
            if (wfObj.success === false) {
                document.getElementById('rulemodalbody').innerHTML = wfObj.message;
                $('#rulemodal').modal({keyboard: true});
            } else {
                wfObj.content.forEach(function (e) {
                    $('#wfDropdown').append(`<a id="${e}" class="dropdown-item" href="#"> ${e} </a>`);
                });
            }
        })
        .catch(function (error) {
            console.log(error);
            document.getElementById('rulemodalbody').innerHTML = error.message;
            $('#rulemodal').modal({keyboard: true});
        })
}


function getExposedContent(wfName, resourceId) {

    // Make a request for a exposed identifier
    this.axios.get('/econtent?wf=' + wfName + '&' + 'rid=' + resourceId)
        .then(function (response) {
            console.log(response);
            wfObj = JSON.parse(response.data);

            console.log(wfObj);
            if (wfObj.success === false) {
                console.log("success false");
                document.getElementById('rulemodaltitle').innerHTML = wfName;
                document.getElementById('rulemodalbody').innerHTML = wfObj.message;
                $('#rulemodal').modal({keyboard: true});
            } else {
                editor.setValue(wfObj.content);
                editor.session.selection.clearSelection();
            }
        })
        .catch(function (error) {
            console.log(error);

            document.getElementById('rulemodaltitle').innerHTML = wfName;
            document.getElementById('rulemodalbody').innerHTML = error.message;
            $('#rulemodal').modal({keyboard: true});
        })
        .finally(function () {
        });
}

function getWfContent(wfName) {

    // Make a request for a rule DAG
    return this.axios.get('/wfcontent?wf=' + wfName)
        .then(function (response) {
            console.log(response);
            wfObj = JSON.parse(response.data);

            console.log(wfObj);
            if (wfObj.success === false) {
                document.getElementById('rulemodaltitle').innerHTML = wfName;
                document.getElementById('rulemodalbody').innerHTML = wfObj.message;
                $('#rulemodal').modal({keyboard: true});
            } else {
                editor.insert(wfObj.content);
            }
        })
        .catch(function (error) {
            console.log(error);
            document.getElementById('rulemodaltitle').innerHTML = wfName;
            document.getElementById('rulemodalbody').innerHTML = error.message;
            $('#rulemodal').modal({keyboard: true});
        })
}

function getRDag(wf) {

    // Make a request for a rule DAG
    axios.get('/rules?wf=' + wf)
        .then(function (response) {
            console.log(response);
            const digraph1 = response.data;

            cycleGraphE();
            gRender(wf, digraph1);

        })
        .catch(function (error) {
            console.log(error);
        })
        .finally(function () {
        });
}

function getFDag(wf) {

    // Make a request for a file DAG
    axios.get('/files?wf=' + wf)
        .then(function (response) {
            console.log(response);
            var digraph1 = response.data;

            cycleGraphE();
            gRender(wf, digraph1);

        })
        .catch(function (error) {
            console.log(error);
        })
}

function getRule(wf, ruleName) {

    // Make a request for a rule DAG
    this.axios.get('/rule?' + 'wf=' + wf + '&' + 'name=' + ruleName)
        .then(function (response) {
            console.log(response);
            ruleLocation = JSON.parse(response.data);
            console.log(ruleLocation);

            if (ruleLocation.success === false) {
                document.getElementById('rulemodaltitle').innerHTML = ruleName;
                document.getElementById('rulemodalbody').innerHTML = ruleLocation.message;
                $('#rulemodal').modal({keyboard: true});
            } else {
                editor.scrollToLine(ruleLocation);
                editor.gotoLine(ruleLocation.content);
            }
        })
        .catch(function (error) {
            console.log(error);
        })
}

function gRender(wf, digraph) {

    const transition = d3.transition()
        .delay(0)
        .duration(500);

    var graphviz = d3.select("#graph").graphviz();
    graphviz.on("end", function () {

        var dotSrcLines = digraph.split('\n');
        nodes = d3.selectAll('.node,.edge');
        nodes.on("click", function () {
            var title = d3.select(this).selectAll('title').text().trim();
            var ruleName = d3.select(this).selectAll('text').text();

            getRule(wf, ruleName);
        });
    });
    graphviz.transition(transition)
        .renderDot(digraph);
}



