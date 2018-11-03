import * as marked from 'marked';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as yaml from 'yamljs';

import { Config } from './config';
import { TemplateRenderer } from './template-renderer';
import { PageData } from './page-data';

export class StaticGen {

  private sourceRootRelPath: string;
  private outputRelPath: string;
  private defaultTemplate = 'default';
  private sourceIndexFile = 'index.md';
  private jsonIndexFile = 'index.json';
  private themeDir = '.theme';
  private urlsPrefix = '/';
  private extension = '.md';
  private config: Config;
  
  private renderer: TemplateRenderer;

  private asyncWrites = new Set<string>();
  private onAllAsyncWritesDone: () => void;


  constructor(config: Config) {

    this.config = config;
    this.sourceRootRelPath = config.sourceDir;
    this.outputRelPath = config.outputDir;

    this.renderer = new TemplateRenderer(path.join(this.sourceRootRelPath, this.themeDir));
  }

  public generate(): void {

    var allPagesData = new Array<PageData>();

    this.getFilenames(this.sourceRootRelPath, this.extension, (relDirPath: string, relFilenames: string[]) => {
      var dirPagesData = this.processDir(relDirPath, relFilenames);
      allPagesData = allPagesData.concat(dirPagesData);
    });

    // site map: page with links to all pages

    var mapPageData = new PageData();
    mapPageData.frontMatter = {
      template: 'sitemap',
      title: 'Site Map'
    };
    mapPageData.url = path.join(this.outputRelPath, 'sitemap.html');
    mapPageData.config = this.config;
    mapPageData.pages = allPagesData;

    this.generatePage(mapPageData.url, this.defaultTemplate, mapPageData);

    // post-processing

    this.executeWhenAllDone(() => {
      if (this.config.duplicatePages !== undefined) {
        this.config.duplicatePages.forEach(dupPage => {
          var src = path.join(this.outputRelPath, dupPage.src, 'index.html');
          var dst = path.join(this.outputRelPath, dupPage.dst, 'index.html');
          console.info(`Copy: ${src} -> ${dst}`);
          fs.copyFileSync(src, dst);
        });
      }
    });
  }

  private executeWhenAllDone(done: () => void) {

    if (this.asyncWrites.size == 0) {
      done();
      return;
    }

    this.onAllAsyncWritesDone = () => {     
      this.onAllAsyncWritesDone = null;
      done();
    }
  }

  private processDir(relDirPath: string, relFilenames: string[]): PageData[] {

    console.info(`Processing folder: ${relDirPath}`);

    var dirPagesData = new Array<PageData>();
    var indexFilename: string = null;
     
    for (var i=0; i<relFilenames.length; i++) {

      var relFilename = relFilenames[i];

      if (relFilename.endsWith(this.sourceIndexFile)) {
        indexFilename = relFilename;
      }
      else {
        // regular content page
        var buf = this.readFile(relFilename);
        var pageData = this.getPageData(buf);
        pageData.url = this.getPageUrl(relFilename);

        dirPagesData.push(pageData);

        this.generatePage(this.getOutputHtmlPageFilename(relFilename), this.defaultTemplate, pageData);
      }
    }

    if (indexFilename != null) {
      // folder index
      var buf = this.readFile(indexFilename);
      var pageData = this.getPageData(buf);
      pageData.url = this.getPageUrl(indexFilename);
      pageData.pages = dirPagesData;

      this.generatePage(this.getOutputHtmlPageFilename(indexFilename), this.defaultTemplate, pageData);

      var jsonIndexFilename = this.getOutputPath(path.join(relDirPath, this.jsonIndexFile));
      //this.generateIndexJson(jsonIndexFilename, pageData);
    }

    return dirPagesData;
  }



  /*
  private generateIndexJson(filename: string, pageData: any): void {

    var contents = {
      map: {
        name: pageData.frontMatter.title,
        center: pageData.frontMatter.latlng,
        zoom: pageData.frontMatter.mapzoom
      },
      pages: []
    };

    if (pageData.pages != null) {
      for (var i=0; i< pageData.pages.length; i++) {

        var pageData = pageData.pages[i];

        var latlng: string = pageData.frontMatter.latlng;

        if (pageData.url !== undefined && 
          pageData.frontMatter.hint !== undefined && 
          pageData.frontMatter.section !== undefined && 
          latlng !== undefined) {

          contents.pages.push({
            id: pageData.url,
            name: pageData.frontMatter.hint,
            section: pageData.frontMatter.section,
            latlng: latlng.split(',')
          });
        }
      }
    }

    this.writeFile(filename, JSON.stringify(contents));
  }
  */

  private getPageData(pageText: string): PageData {

    const fmSeparator = '---';
    const fmLength = fmSeparator.length;

    var fmBegin = pageText.indexOf(fmSeparator);
    var fmEnd = pageText.indexOf(fmSeparator, fmBegin + fmLength);
    var frontMatterStr = pageText.substring(fmBegin + fmLength, fmEnd);

    var pageData = new PageData();
    pageData.frontMatter = yaml.parse(frontMatterStr);
    pageData.content = marked(pageText.substr(fmEnd + fmLength));
    pageData.config = this.config;

    return pageData;
  }

  private generatePage(outputFilename: string, templateName: string, pageData: PageData): void {
    try {
      var html = this.renderer.renderTemplate(templateName, pageData);
      this.writeFile(outputFilename, html);
    } 
    catch (err) {
      console.error(`ERROR: can't create ${outputFilename}`);
      throw err;
    }
  }

  private getPageUrl(sourceRelFilename: string): string {
    var from = sourceRelFilename.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
    var to = sourceRelFilename.lastIndexOf('.');
    return path.join(this.urlsPrefix, sourceRelFilename.substring(from, to));
  }

  private getOutputPath(sourceRelPath: string): string {
    var from = sourceRelPath.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
    return path.join(this.outputRelPath, sourceRelPath.substr(from));
  }

  private getOutputHtmlPageFilename(sourceRelFilename: string): string {
    var from = sourceRelFilename.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
    var to = sourceRelFilename.lastIndexOf('.');

    if (sourceRelFilename.endsWith(this.sourceIndexFile)) {
      return path.join(this.outputRelPath, sourceRelFilename.substring(from, to) + '.html');
    }
    else {
      return path.join(this.outputRelPath, sourceRelFilename.substring(from, to), 'index.html');
    }
  }

  private readFile(filename: string): string {
    return fs.readFileSync(filename).toString();
  }

  private writeFile(filename: string, contents: string): void {

    console.log(`Writing: ${filename}`);

    this.asyncWrites.add(filename);
    
    mkdirp(path.dirname(filename), (err) => {
      
      if (err) {
        console.error(`ERROR: can't create folder ${path.dirname(filename)}`);
        return;
      }

      fs.writeFile(filename, contents, (err) => {
        if (err) {
          console.error(`ERROR: can't write to ${filename}`);
        }
        this.asyncWrites.delete(filename);
        if (this.asyncWrites.size == 0 && this.onAllAsyncWritesDone !== null) {
          this.onAllAsyncWritesDone();
        }
      });
    });
  }

  /*
   * Explores recursively a directory and returns all the filepaths and folderpaths in the callback.
   */
  private getFilenames(relDirPath: string, extension: string, onDirFiles: (relDirPath: string, relFilenames: string[]) => void): void {

    var relFilenames = Array<string>();
    var relDirPaths = Array<string>();

    //console.info(`getFilenames for ${relDirPath}`)

    var files = fs.readdirSync(relDirPath);

    files.forEach((file: string) => {
        var relFilename: string = path.join(relDirPath, file);

        if (fs.statSync(relFilename).isDirectory() && !relFilename.endsWith(this.themeDir)) {
            relDirPaths.push(relFilename);
        }
        else if (file.endsWith(extension)) {
            relFilenames.push(relFilename);
        }
    });

    onDirFiles(relDirPath, relFilenames);

    relDirPaths.forEach((dir: string) => {
      this.getFilenames(dir, extension, onDirFiles);
    });
  }
}

