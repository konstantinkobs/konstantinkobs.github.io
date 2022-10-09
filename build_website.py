from jinja2 import Environment, FileSystemLoader
import json

# load publications
with open("papers.json", "r") as f:
    papers = json.load(f)

# load music
with open("music.json", "r") as f:
    albums = json.load(f)

# load website template
environment = Environment(loader=FileSystemLoader("templates/"))
template = environment.get_template("index.html")

# render template
html = template.render(papers=papers, albums=albums)

with open("index.html", mode="w", encoding="utf-8") as page:
    page.write(html)
