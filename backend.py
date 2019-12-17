import errno
import glob
import json
import os
import random
import re
import string
import sys
import cherrypy
import jstree
import snakemake
import pathspec
from io import StringIO


class CapStdIo(list):
    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self

    def __exit__(self, *args):
        self.extend(self._stringio.getvalue().splitlines())
        del self._stringio  # free up some memory
        sys.stdout = self._stdout


def get_random_id(size=8, chars=string.ascii_uppercase + string.digits):
    # TODO: paramterize
    return "XS" + ''.join(random.choice(chars) for x in range(size))


class XSnakeServer(object):
    exposedViewPaths = {}

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def workflows(self):
        eResponse = {
            "content": "",
            "success": False,
            "message": ""
        }

        # Generate and store unique identifier to the path for lookup, store in global dict
        # Build workflow tree at the start
        if not bool(XSnakeServer.exposedViewPaths):
            workflows = [wf for wf in cherrypy.request.app.config['XSnake.ExposedWorkflows']
                         if cherrypy.request.app.config['XSnake.ExposedWorkflows'][wf] == 'allow']

            for wf in workflows:
                XSnakeServer.exposedViewPaths[wf] = {}
                print("== Workdir %s" % wf)
                owd = os.getcwd()
                print("== Workdir owd: %s" % owd)
                os.chdir(cherrypy.request.app.config['XSnake']['workflows.top_dir'])
                # os.chdir(os.path.join(cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf))
                print("== Chdir'd Workdir owd: %s" % os.getcwd())
                # TODO: check for specfile
                spec_file = os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf,
                    cherrypy.request.app.config['XSnake']['workflows.default_pathspec']
                )
                print("== Spec_file: %s" % spec_file)
                with open(spec_file) as f:
                    spec = pathspec.PathSpec.from_lines('gitwildmatch', f)
                    for path in glob.iglob(wf + "/**", recursive=True):
                        if spec.match_file(path):
                            if os.path.isfile(path):  # Only add files
                                print("== Adding file (%s) : %s" % (wf, path))
                                rid = get_random_id()
                                XSnakeServer.exposedViewPaths[wf][rid] = jstree.Path(path, rid)
                os.chdir(owd)

                print("== Exposed paths in %s" % (wf))
                [print(v) for v in XSnakeServer.exposedViewPaths[wf].values()]

        eResponse['success'] = True
        eResponse['content'] = list(XSnakeServer.exposedViewPaths.keys())

        return json.dumps(eResponse)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def wtree(self, wf):
        t = jstree.JSTree(XSnakeServer.exposedViewPaths[wf].values())
        d = t.jsonData()
        return d

    @cherrypy.expose
    def rules(self, wf):
        with CapStdIo() as soutput:
            snakemake.snakemake(
                os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf,
                    cherrypy.request.app.config['XSnake']['workflows.default_snakemake']
                ),
                printdag=True, targets=["all"], dryrun=True,
                workdir=os.path.join(cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf),
                nocolor=True, quiet=True)
            return soutput

    @cherrypy.expose
    def files(self, wf):
        with CapStdIo() as soutput:
            snakemake.snakemake(
                os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf,
                    cherrypy.request.app.config['XSnake']['workflows.default_snakemake']
                ),
                printfilegraph=True,
                targets=["all"], dryrun=True,
                workdir=os.path.join(cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf),
                nocolor=True, quiet=True)
            return soutput

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def econtent(self, wf, rid):

        eResponse = {
            "content": "",
            "success": False,
            "message": "Invalid parameters"
        }
        if not wf or not rid:
            eResponse["message"] = "No Workflow or resource specified"
            return json.dumps(eResponse)

        if rid not in XSnakeServer.exposedViewPaths[wf].keys():
            eResponse["message"] = "Resource id not in the allowed list"
            return json.dumps(eResponse)

        try:
            with open(os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'],
                    str(XSnakeServer.exposedViewPaths[wf][rid].path))) as f:
                cherrypy.log(f.name)
                eResponse["content"] = f.read()
                eResponse["success"] = True
                eResponse["message"] = ""
        except IOError as x:
            if x.errno == errno.ENOENT:
                eResponse["message"] = "File does not exist" + str(XSnakeServer.exposedViewPaths[wf][rid].path)
            elif x.errno == errno.EACCES:
                eResponse["message"] = "File cannot be read"
            else:
                eResponse["message"] = "Unknown error when accessing File"

        return json.dumps(eResponse)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def wfcontent(self, wf):

        aResponse = {
            "content": "",
            "success": False,
            "message": ""
        }
        if not wf:
            aResponse['message'] = "Empty Workflow file name submitted"
            return json.dumps(aResponse)

        try:
            with open(os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf,
                    cherrypy.request.app.config['XSnake']['workflows.default_snakemake']
            )) as f:
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
    def rule(self, wf, name):

        aResponse = {
            "content": "",
            "success": False,
            "message": ""
        }

        if not name or not wf:
            aResponse['message'] = "Invalid workflow name or a rule name"
            return json.dumps(aResponse)

        try:
            # TODO: fix dynamic parameters
            with open(os.path.join(
                    cherrypy.request.app.config['XSnake']['workflows.top_dir'], wf,
                    cherrypy.request.app.config['XSnake']['workflows.default_snakemake']
            )) as f:
                wrp = re.compile(r"^rule\s+" + re.escape(name) + r'\s*:$')
                for mark, line in enumerate(f.readlines()):
                    wr = wrp.match(line)
                    if wr:
                        aResponse["content"] = mark + 1  # zero-based enumerator, editoe lines are 1-based
                        aResponse["success"] = True
                        aResponse["message"] = ""
                        break
                    else:
                        aResponse["message"] = "No matching rule found..."

        except IOError as x:
            if x.errno == errno.ENOENT:
                aResponse["message"] = "File does not exist"
            elif x.errno == errno.EACCES:
                aResponse["message"] = "File cannot be read"
            else:
                aResponse["message"] = "Unknown error when accessing file"

        return json.dumps(aResponse)

    @cherrypy.expose
    def index(self):
        return open(
                os.path.join(
                    cherrypy.request.app.config['/']['tools.staticdir.root'],
                    cherrypy.request.app.config['/static']['tools.staticdir.dir'],
                    cherrypy.request.app.config['/static']['tools.staticdir.index']
                    ))


if __name__ == '__main__':
    cherrypy.config.update((os.path.join(os.curdir, "server.conf")))
    app = XSnakeServer()
    cherrypy.tree.mount(app, '/', config=os.path.join(os.curdir, "app.conf"))
    cherrypy.engine.start()
    cherrypy.engine.block()
