$(document).ready(function () {
    // Ace Editor
    var editor = ace.edit("editor");

    // Set some defaults
    editor.setOptions({
        theme: "ace/theme/textmate",
    });
    editor.session.setMode("ace/mode/python");
    editor.setKeyboardHandler("ace/keyboard/sublime");

    // Set Highlight Lang Mode
    $("#-mode").on("change", function () {
        var selectedMode = $(':selected', this).val();
        editor.session.setMode(selectedMode);
    });

    $("#keyboardHandler button").on("click", function () {
        var thisBtn = $(this);
        thisBtn.addClass('active').siblings().removeClass('active');
        var btnText = thisBtn.text();
        var btnValue = thisBtn.val();
        editor.setKeyboardHandler(btnValue);
    });


    // Listeners
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
    $('#wtreeCollapse').on("click", function (e) {
        $('#wtree').jstree("close_all");
    });
    $('#wtreeExpand').on("click", function (e) {
        $('#wtree').jstree('open_all');
    });

    // Setup Split.js
    var splitobj = Split(["#one", "#two", "#three"], {
        elementStyle: function (dimension, size, gutterSize) {
            $(window).trigger('resize'); // Optional
            return {'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'}
        },
        gutterStyle: function (dimension, gutterSize) {
            return {'flex-basis': gutterSize + 'px'}
        },
        sizes: [20, 50, 20],
        minSize: 10,
        gutterSize: 6,
        cursor: 'col-resize'
    });

    // Set-up the graph popout button
    d3.select('#popOut').on('click', function () {
        var width = 300, height = 300;
        var svg = d3.select('#graph > svg')
        var svgString = getSVGString(svg.node());
        // svgString2Image( svgString, 2*width, 2*height, 'png' ); // passes Blob and filesize String to the callback
        var opened = window.open(this.href, 'tw', `toolbar=no,
                                    location=no,
                                    status=no,
                                    menubar=no,
                                    scrollbars=yes,
                                    resizable=yes,
                                    width=${width},
                                    height=${height}`);
        if (opened) {
            opened.document.write(svgString);
            opened.document.close();
            opened.focus();
        }
    });

    // Fire Up Workflows
    getWorkflows();


/* *******************************************
*
* FUNCTIONS
*
* *********************************************/

    // (Re-)Create DAGs
    function cycleGraphE() {
        const gs = document.getElementById('graphs');
        gs.removeChild(gs.childNodes[0]);

        const g = document.createElement('span');
        g.id = 'graph';
        gs.appendChild(g);
    }

    function getWTree(wfName) {
        var wtree = $('#wtree');
        wtree.unbind().removeData();
        wtree.jstree({
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
            $(this).jstree() // open_all
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
                    editor.selectAll()
                    editor.setValue("", 0)
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
        // Make a request for a rule location
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



    // Util Functions

        function getSVGString(svgNode) {
        //svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var cssStyleText = getCSSStyles(svgNode);
        appendCSS(cssStyleText, svgNode);

        var serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(svgNode);
        svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
        svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

        return svgString;

        function getCSSStyles(parentElement) {
            var selectorTextArr = [];

            // Add Parent element Id and Classes to the list
            selectorTextArr.push('#' + parentElement.id);
            for (var c = 0; c < parentElement.classList.length; c++)
                if (!contains('.' + parentElement.classList[c], selectorTextArr))
                    selectorTextArr.push('.' + parentElement.classList[c]);

            // Add Children element Ids and Classes to the list
            var nodes = parentElement.getElementsByTagName("*");
            for (var i = 0; i < nodes.length; i++) {
                var id = nodes[i].id;
                if (!contains('#' + id, selectorTextArr))
                    selectorTextArr.push('#' + id);

                var classes = nodes[i].classList;
                for (var c = 0; c < classes.length; c++)
                    if (!contains('.' + classes[c], selectorTextArr))
                        selectorTextArr.push('.' + classes[c]);
            }

            // Extract CSS Rules
            var extractedCSSText = "";
            for (var i = 0; i < document.styleSheets.length; i++) {
                var s = document.styleSheets[i];

                try {
                    if (!s.cssRules) continue;
                } catch (e) {
                    if (e.name !== 'SecurityError') throw e; // for Firefox
                    continue;
                }

                var cssRules = s.cssRules;
                for (var r = 0; r < cssRules.length; r++) {
                    if (contains(cssRules[r].selectorText, selectorTextArr))
                        extractedCSSText += cssRules[r].cssText;
                }
            }

            return extractedCSSText;

            function contains(str, arr) {
                return arr.indexOf(str) === -1 ? false : true;
            }
        }

        function appendCSS(cssText, element) {
            var styleElement = document.createElement("style");
            styleElement.setAttribute("type", "text/css");
            styleElement.innerHTML = cssText;
            var refNode = element.hasChildNodes() ? element.children[0] : null;
            element.insertBefore(styleElement, refNode);
        }
    }
});


