# BakeIt - Static Site Generator (with store locator map template)

BakeIt allows you to generate website from Markdown (.md) source files. It uses {{ handlebars }} or {{ mustache }} as templating language.
It comes with template to build sites with store/business locator map.

## Quick start

Install bakeit:

    npm install -g bakeit

Create your website project:

    bakeit init my-website
    cd my-website

Put your source .md files to:

    src/

Your website URLs structure will mirror folders structure of the source files. I.e.:

    /src/newyork/index.md                 -> http://<your-website>/newyork
    /src/newyork/empire-state-building.md -> http://<your-website>/newyork/empire-state-building

To generate web-site run:

    bakeit

To run development HTTP server:

    bakeit serve

## Source (.md) files format

    ---
    hint: Empire State Building
    title: Empire State Building, New York, USA
    youtube: SO4tjI43Ob4
    latlng: 40.7479448,-73.9902954
    tags: skyscrapers, buildings, landmark
    ---
    The Empire State Building is an American cultural icon and has been featured in more than 250 TV shows and movies since the film King Kong was released in 1933. A symbol of New York City, the tower has been named as one of the Seven Wonders of the Modern World by the American Society of Civil Engineers. The Empire State Building and its ground-floor interior have been designated as a city landmark by the New York City Landmarks Preservation Commission, and were confirmed as such by the New York City Board of Estimate. It was also designated a National Historic Landmark in 1986, and was ranked number one on the American Institute of Architects' List of America's Favorite Architecture in 2007.

    [Read more on Wikipedia](https://en.wikipedia.org/wiki/Empire_State_Building)

The upper part of each .md file is called front matter. You can access all variables defined in the front matter in templates.
All front matter variables are optional.

## Templates format

There must be at least one default template (src/.theme/default.html):

    <template>
    <html>
    <head>
    ...
    </head>
    <body>
        {{{navBar}}}

        <h1>{{frontMatter.title}}</h1>
        
        <div>{{{content}}}</div>
    </body>
    </html>
    </template>

    <script>
    function beforeRender(engine, pageData) {
        pageData.navBar = engine.renderTemplate('navbar', pageData);
    }
    </script>

You can use JavaScript to pre-process each template rendering. I.e. in the example above {{{navBar}}} is populated using another template (src/.theme/navbar.html). This allows to nest one template into another.

Script section is optional.
