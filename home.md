---
layout: default
---

<h1>Wohnzimmerlicht</h1>

<div class="button_wrapper">
    <span data-id="switch1" class="button button_on">AN</span>
    <span data-id="switch1" class="button button_off" href="#">AUS</span>
</div>


<div id="status">
    <h1>Debug Status</h1>
    <iframe src="" id="iframe"></iframe>
</div>

<script>
    const buttons = document.querySelectorAll(".button");
    const iframe = document.querySelector("#iframe");

    function getUrl(button_id, state) {
        return "http://kobsnas.local:51828/?accessoryId=" + button_id + "&state=" + state;
    }

    buttons.forEach(function(button) {
        button.addEventListener("click", function(e) {
            const button_id = this.getAttribute("data-id");
            const state = this.classList.contains("button_on");
            iframe.src = getUrl(button_id, state);
            
            e.preventDefault();
            e.stopPropagation();
        })
    });


    // fetch(url + "switch1")
    //    .then(response => {return response.json()})
    //    .then(data => console.log(data));

    //switch1.addEventListener('click', () => {
    //    fetch("http://kobsnas.local:51828/?accessoryId=switch1&state=false")
    //})
</script>

<style>
    .button_wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 350px;
        align-items: stretch;
        
        border: 1px solid #eee;
    }

    .button {
        text-align: center;
        padding: 30px;
        text-decoration: none;
        cursor: pointer;
    }

    .button_on {
        color: black;
        background: white;
    }

    .button_off {
        color: white;
        background: black;
    }

    #iframe {
        display: block;
        border: none;
        outline: none;
    }

    #status {
        opacity: 0.3;
        margin-top: 200px;
    }
</style>