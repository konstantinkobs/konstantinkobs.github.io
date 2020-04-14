---
layout: default
---
<img class="header-image" src="images/header-image.jpg">

<div class="releases">
    {% for release in site.data.music %}
        <div class="release">

            <h1>{{ release.name }}</h1>

            <img class="cover" src="/images/covers/{{release.cover}}">

            <iframe width="100%" height="52" src="https://embed.song.link/?url={{release.link}}&theme=light" frameborder="0" allowfullscreen sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe>

            {% if release.tracklist %}
                <ol>
                    {% for track in release.tracklist %}
                        <li>{{ track }}</li>
                    {% endfor %}
                </ol>
            {% endif %}

        </div>
    {% endfor %}
</div>