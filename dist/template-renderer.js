"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Mustache = require("mustache");
const Handlebars = require("handlebars");
class TemplateRenderer {
    constructor(config, relThemePath) {
        this.templateExtension = '.html';
        this.config = config;
        this.relThemePath = relThemePath;
        if (config.build.templateFileExtension !== undefined) {
            this.templateExtension = config.build.templateFileExtension;
        }
    }
    renderTemplate(templateName, pageData) {
        var buf;
        var filename = path.join(this.relThemePath, templateName + this.templateExtension);
        var html = '';
        try {
            buf = fs.readFileSync(filename).toString();
            html = this.renderTemplateImpl(buf, pageData);
        }
        catch (err) {
            console.error(`ERROR in template: ${filename}`);
            throw err;
        }
        return html;
    }
    renderTemplateImpl(rawTemplate, pageData) {
        var buf = rawTemplate;
        var template = this.getContentBetweenTags(buf, 'template');
        if (template == null) {
            throw new Error(`ERROR: Invalid theme - missing <template> tag!`);
        }
        // cut out template part
        buf = buf.substr(buf.lastIndexOf('</template>') + '</template>'.length);
        var script = this.getContentBetweenTags(buf, 'script');
        if (script != null) {
            // run script
            var beforeRender = new Function('engine', 'pageData', `${script};\n beforeRender(engine, pageData);`);
            beforeRender(this, pageData);
        }
        var templateLang = this.config.build.templateLanguage;
        var html;
        if (templateLang === undefined || templateLang === 'handlebars') {
            var handlebarsTemplate = Handlebars.compile(template);
            html = handlebarsTemplate(pageData);
        }
        else if (templateLang === 'mustache') {
            html = Mustache.render(template, pageData);
        }
        return html;
    }
    getContentBetweenTags(source, tag) {
        var regexp = new RegExp(`<${tag}>([\\S\\s]*?)</${tag}>`, 'g');
        var matched = source.match(regexp);
        if (matched == null) {
            return null;
        }
        return matched.map(val => {
            var replaceRegexp = new RegExp(`</?${tag}>`, 'g');
            return val.replace(replaceRegexp, '');
        })[0];
    }
}
exports.TemplateRenderer = TemplateRenderer;
//# sourceMappingURL=template-renderer.js.map