import itunespy
import urllib.request
import json
import os

artist_id = 1431470000
artist = itunespy.lookup(id=artist_id)[0]
albums = artist.get_albums()

def process_album(album):
    cover_path = f"covers/{album.collection_id}.jpg"

    new_album = {
        'cover_path': cover_path,
        'artist': album.artist_name,
        'title': album.collection_name,
        'release_date': album.release_date
    }
    # download cover in larger size if not yet available
    cover_link = album.artwork_url_100.replace("100x100bb", "500x500bb")
    if not os.path.isfile(cover_path):
        urllib.request.urlretrieve(cover_link, cover_path)

    return new_album

albums = [process_album(album) for album in albums]

with open("music.json", "w") as f:
    json.dump(albums, f)
