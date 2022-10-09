from semanticscholar import SemanticScholar
import json

author_id = "1493276636"

sch = SemanticScholar()

author = sch.get_author(author_id)

papers = author["papers"]

print(papers)

def process_paper(paper):
    new_paper = {
        "title": paper["title"],
        "authors": [author['name'] for author in paper["authors"]],
        "abstract": paper["abstract"],
        "venue": paper["venue"],
        "year": paper["year"],
        "publicationDate": paper["publicationDate"],
        "url": paper["url"]
    }
    return new_paper

papers = [process_paper(paper) for paper in papers]

with open("papers.json", "w") as f:
    json.dump(papers, f)
