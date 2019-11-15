import cherrypy
import snakemake
import sys
import os
import re

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
    def rule(self, name):

        if not name:
            return "Invalid name"

        position, message = "", ""
        with Capturing() as soutput:
            snakemake.snakemake("/Users/dimas/Code/xsnake/Workflow.0x0",
                                dryrun=True, print_compilation=True, targets=[name],
                                workdir="/Users/dimas/Code/xsnake/", nocolor=True, quiet=True)
        output = str(soutput).replace("'", "").replace('"',"").replace(",","")
        wrp = re.compile(r""".+?@workflow.rule\((name=""" + re.escape(name) + r""".+?)\).+?""")
        wr = wrp.match(output)
        if wr:
            position = wr.group(1)
            wrm = re.compile(r""".+?@workflow.rule\((name="""
                             + re.escape(name)
                             + r""".+?)\).+?@workflow.message\((.+?)\)""")
            wm = wrm.match(output)
            if wm:
                message = wm.group(2)

        return "\n".join([position, message])

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
