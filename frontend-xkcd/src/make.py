#! /usr/bin/env python
import sys, os
from pathlib import Path

import markdown2

# use local folder as cwd
os.chdir(Path(sys.argv[0]).parent)

with open("instructions.md") as f:
    html = markdown2.markdown(
        f.read(), extras=['fenced-code-blocks'])

with open("umbrella.html") as f:
    original = f.read()

with open("../index.html", 'w') as f:
    f.write(original.replace('<<include instructions.md>>', html))
