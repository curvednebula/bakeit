import * as fs from 'fs';
import * as path from 'path';
import * as mustache from 'Mustache';

import {PageData} from './page-data';


export class TemplateRenderer {

  private templateExtension = '.html';
  private relThemePath: string;

  constructor(relThemePath: string) {
    this.relThemePath = relThemePath;
  }

  public renderTemplate(templateName: string, pageData: PageData): string {

    var buf: string;
    var filename: string = path.join(this.relThemePath, templateName + this.templateExtension);
    var html: string = '';

    try {
      buf = fs.readFileSync(filename).toString();
      html = this.renderTemplateImpl(buf, pageData);
    } catch (err) {
      console.error(`ERROR in template: ${filename}`);
      throw err;
    }
    return html;
  }

  private renderTemplateImpl(rawTemplate: string, pageData: PageData): string {

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
      var beforeRender = new Function('renderer', 'pageData', `${script};\n beforeRender(renderer, pageData);`);
      beforeRender(this, pageData);
    }

    var html: string = mustache.render(template, pageData);
    return html;
  }

  private getContentBetweenTags(source: string, tag: string): string {

    var regexp = new RegExp(`<${tag}>([\\S\\s]*?)</${tag}>`, 'g');
    var matched = source.match(regexp);

    if (matched == null) {
      return null;
    }

    return matched.map(val => {
      var replaceRegexp = new RegExp(`</?${tag}>`, 'g');
      return val.replace(replaceRegexp,'');
    })[0];
  }
}