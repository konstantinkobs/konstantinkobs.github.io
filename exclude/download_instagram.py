import requests
import json
import os

instagram_name = "konstantinkobs"

print("Setting working directory to this folder")
path = os.path.dirname(os.path.abspath(__file__))
os.chdir(path)

print("Download JSON file")
j = requests.get(f"https://www.instagram.com/{instagram_name}/?__a=1").json()

insta_posts = []
print("Getting all posts")
posts = j["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"]
for post in posts:
    p = post["node"]
    
    insta_post = {}

    insta_post["image_url"] = p["display_url"]
    insta_post["url"] = f"https://instagram.com/p/{p['shortcode']}"
    # insta_post["description"] = p["edge_media_to_caption"]["edges"][0]["node"]["text"]
    insta_post["timestamp"] = p["taken_at_timestamp"]

    insta_posts.append(insta_post)

print("Saving posts to data directory")
with open("../_data/instagram.json", "w") as f:
    json.dump(insta_posts, f, indent=4)
