# BakeIt - Static site generator

BakeIt allows you to generate website from Markdown (.md) source files. It uses {{ mustache }} as templating language.
This is work in progress yet. While it is functional tool already.

## Quick start

Install bakeit:

    npm install -g bakeit

Create your website project:

    bakeit init my-website
    cd my-website

Put your source .md files to:

    src/

and template files to:

    src/.theme/

To generate web-site run:

    bakeit

To run development HTTP server:

    bakeit serve

## Source (.md) files format

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
        pageData.navBar = renderer.renderTemplate('navbar', pageData);
    }
    </script>

You can use JavaScript to pre-process each template rendering. I.e. in the example above {{{navBar}}} is populated using another template (src/.theme/navbar.html). This allows to nest one template into another.

Script section is optional.
