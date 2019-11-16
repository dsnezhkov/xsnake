import errno

import cherrypy
import snakemake
import sys
import os
import re
import json

try:
    from StringIO import StringIO
except ImportError:
    from io import StringIO


class Capturing(list):

    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self

    def __exit__(self, *args):
        self.extend(self._stringio.getvalue().splitlines())
        del self._stringio  # free up some memory
        sys.stdout = self._stdout


class HelloWorld(object):
    @cherrypy.expose
    def rules(self):
        with Capturing() as soutput:
            snakemake.snakemake("/Users/dimas/Code/xsnake/Workflow.0x0",
                                printdag=True, targets=["glue_nmap2tbl"], dryrun=True,
                                workdir="/Users/dimas/Code/xsnake/", nocolor=True, quiet=True)
            return soutput

    @cherrypy.expose
    def files(self):
        with Capturing() as soutput:
            snakemake.snakemake("/Users/dimas/Code/xsnake/Workflow.0x0", printfilegraph=True,
                                targets=["glue_nmap2tbl"], dryrun=True,
                                workdir="/Users/dimas/Code/xsnake/", nocolor=True, quiet=True)
            return soutput

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def wfcontent(self, wf):

        aResponse = {
            "content": "",
            "success": False,
            "message": "Empty Worflow file name submitted"
        }
        if not wf:
            return json.dumps(aResponse)

        try:
            with open(os.path.join('/Users/dimas/Code/xsnake/', wf)) as f:
                aResponse["content"] = f.read()
                aResponse["success"] = True
                aResponse["message"] = ""
        except IOError as x:
            if x.errno == errno.ENOENT:
                aResponse["message"] = "Workflow file does not exist"
            elif x.errno == errno.EACCES:
                aResponse["message"] = "Workflow file cannot be read"
            else:
                aResponse["message"] = "Unknown error when accessing Workflow file"

        return json.dumps(aResponse)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def rule(self, name):

        if not name:
            return "Invalid name"

        aResponse = {
            "content": "",
            "success": False,
            "message": ""
        }

        try:
            # TODO: fix dynamic parameters
            with open(os.path.join('/Users/dimas/Code/xsnake/', "Workflow.0x0")) as f:
                wrp = re.compile(r"^rule\s+" + re.escape(name) + r'\s*:$')
                for mark, line in enumerate(f.readlines()):
                    print("matching[", line, "]")
                    wr = wrp.match(line)
                    if wr:
                        aResponse["content"] = mark+1 # zero-based enumerator, editor is 1-based
                        aResponse["success"] = True
                        aResponse["message"] = ""
                        break
                    else:
                        aResponse["message"] = "No matching rule found..."

        except IOError as x:
            if x.errno == errno.ENOENT:
                aResponse["message"] = "Workflow file does not exist"
            elif x.errno == errno.EACCES:
                aResponse["message"] = "Workflow file cannot be read"
            else:
                aResponse["message"] = "Unknown error when accessing Workflow file"

        return json.dumps(aResponse)


    @cherrypy.expose
    def index(self):
        return open(os.path.join("./public", 'index.html'))


if __name__ == '__main__':
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd())
        },
        '/static': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './public/'
        }
    }
    cherrypy.quickstart(HelloWorld(), '/', conf)
