# BakeIt - Static site generator (yes, one more)

BakeIt allows you to generate website from Markdown (.md) source files. It uses {{ mustache }} as templating language.
This is work in progress yet. While it is functional tool already.

## Quick start

Install bakeit:

    npm install -g bakeit

Create NPM project for your web-site:

    npm init

Create bakeit-config.json file in the project folder:

    {
      "sourceDir": "src",
      "outputDir": "dist",

      "menuItems": [
        {
          "name": "Home", 
          "url": "/"
        },
        {
          "name": "About", 
          "url": "/about"
        }
      ]
    }

Put your source .md files to:

    src/

and template files to:

    src/.theme/

To generate web-site run:

    bakeit

To run development HTTP server:

    bakeit serve

## Source files format

    ---
    template: map
    title: This is title. It will go to {{frontMatter.title}}
    ---
    This will go to {{{content}}}.

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
    function beforeRender(renderer, pageData) {
        // you can use java script to pre-process each template rendering, by populating new template parts
        // i.e. in this case {{{navBar}}} is populated using another template
        // which allows to nest one template into another
        pageData.navBar = renderer.renderTemplate('navbar', pageData);
    }
    </script>

I.e. navbar template could be (src/.theme/navbar.html):

    <template>
      <div class="navbar-nav">
        {{#menuItems}}
        <a href="{{url}}">{{name}}</a>
        {{/menuItems}}
      </div>
    </template>

It uses {{#menuItems}} ... {{/menuItems}} construct. Menu items are defined in the bakeit-config.json file.

Note that script section is optional. It allows to perform pageData pre-processing before the page is rendered.
