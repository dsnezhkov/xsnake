#!/usr/bin/env python3
import pathspec
import os
import glob
import argparse


def verify(dir2chk, spec):
    owd = os.getcwd()
    try:
        os.chdir(dir2chk)
        with open(spec) as s:
            spec = pathspec.PathSpec.from_lines('gitwildmatch', s)
            print("=== Matches ===")
            for f in glob.iglob("**/**", recursive=True):
                print("%5s : %s" % (spec.match_file(f), f))
        os.chdir(owd)
    except IOError as e:
        print(e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Check snakespec against a directory')
    parser.add_argument('dir', type=str, help='Workflow directory to check')
    parser.add_argument('spec', type=str, help='Spec File')
    args = parser.parse_args()

    verify(args.dir, args.spec)
