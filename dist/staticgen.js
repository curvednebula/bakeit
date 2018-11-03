"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const marked = require("marked");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("yamljs");
const template_renderer_1 = require("./template-renderer");
const page_data_1 = require("./page-data");
class StaticGen {
    constructor() {
        this.defaultTemplate = 'default';
        this.sourceIndexFile = 'index.md';
        this.jsonIndexFile = 'index.json';
        this.themeDir = '.theme';
        this.urlsPrefix = '/';
        this.extension = '.md';
        this.asyncWrites = new Set();
    }
    generate(config) {
        this.config = config;
        this.sourceRootRelPath = config.sourceDir;
        this.outputRelPath = config.outputDir;
        this.renderer = new template_renderer_1.TemplateRenderer(path.join(this.sourceRootRelPath, this.themeDir));
        fse.emptyDir(this.outputRelPath)
            .then(() => {
            this.generateOutput();
            this.postProcessing();
        });
    }
    generateOutput() {
        var allPagesData = new Array();
        this.getFilenames(this.sourceRootRelPath, this.extension, (relDirPath, relFilenames) => {
            var dirPagesData = this.processDir(relDirPath, relFilenames);
            allPagesData = allPagesData.concat(dirPagesData);
        });
        // site map: page with links to all pages
        if (this.config.sitemap === true) {
            var mapPageData = new page_data_1.PageData();
            mapPageData.frontMatter = {
                template: 'sitemap',
                title: 'Site Map'
            };
            mapPageData.url = path.join(this.outputRelPath, 'sitemap.html');
            mapPageData.config = this.config;
            mapPageData.pages = allPagesData;
            this.generatePage(mapPageData.url, this.defaultTemplate, mapPageData);
        }
    }
    postProcessing() {
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
    executeWhenAllDone(done) {
        if (this.asyncWrites.size == 0) {
            done();
            return;
        }
        this.onAllAsyncWritesDone = () => {
            this.onAllAsyncWritesDone = null;
            done();
        };
    }
    processDir(relDirPath, relFilenames) {
        console.info(`Processing folder: ${relDirPath}`);
        var dirPagesData = new Array();
        var indexFilename = null;
        for (var i = 0; i < relFilenames.length; i++) {
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
    getPageData(pageText) {
        const fmSeparator = '---';
        const fmLength = fmSeparator.length;
        var fmBegin = pageText.indexOf(fmSeparator);
        var fmEnd = pageText.indexOf(fmSeparator, fmBegin + fmLength);
        var frontMatterStr = pageText.substring(fmBegin + fmLength, fmEnd);
        var pageData = new page_data_1.PageData();
        pageData.frontMatter = yaml.parse(frontMatterStr);
        pageData.content = marked(pageText.substr(fmEnd + fmLength));
        pageData.config = this.config;
        return pageData;
    }
    generatePage(outputFilename, templateName, pageData) {
        try {
            var html = this.renderer.renderTemplate(templateName, pageData);
            this.writeFile(outputFilename, html);
        }
        catch (err) {
            console.error(`ERROR: can't create ${outputFilename}`);
            throw err;
        }
    }
    getPageUrl(sourceRelFilename) {
        var from = sourceRelFilename.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
        var to = sourceRelFilename.lastIndexOf('.');
        return path.join(this.urlsPrefix, sourceRelFilename.substring(from, to));
    }
    getOutputPath(sourceRelPath) {
        var from = sourceRelPath.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
        return path.join(this.outputRelPath, sourceRelPath.substr(from));
    }
    getOutputHtmlPageFilename(sourceRelFilename) {
        var from = sourceRelFilename.indexOf(this.sourceRootRelPath) + this.sourceRootRelPath.length;
        var to = sourceRelFilename.lastIndexOf('.');
        if (sourceRelFilename.endsWith(this.sourceIndexFile)) {
            return path.join(this.outputRelPath, sourceRelFilename.substring(from, to) + '.html');
        }
        else {
            return path.join(this.outputRelPath, sourceRelFilename.substring(from, to), 'index.html');
        }
    }
    readFile(filename) {
        return fs.readFileSync(filename).toString();
    }
    writeFile(filename, contents) {
        console.log(`Writing: ${filename}`);
        this.asyncWrites.add(filename);
        fse.ensureDir(path.dirname(filename))
            .then(() => {
            fs.writeFile(filename, contents, (err) => {
                if (err) {
                    console.error(`ERROR: can't write to ${filename}`);
                }
                this.asyncWrites.delete(filename);
                if (this.asyncWrites.size == 0 && this.onAllAsyncWritesDone !== null) {
                    this.onAllAsyncWritesDone();
                }
            });
        })
            .catch((err) => {
            if (err) {
                console.error(`ERROR: can't create folder ${path.dirname(filename)}`);
                return;
            }
        });
    }
    /*
     * Explores recursively a directory and returns all the filepaths and folderpaths in the callback.
     */
    getFilenames(relDirPath, extension, onDirFiles) {
        var relFilenames = Array();
        var relDirPaths = Array();
        //console.info(`getFilenames for ${relDirPath}`)
        var files = fs.readdirSync(relDirPath);
        files.forEach((file) => {
            var relFilename = path.join(relDirPath, file);
            if (fs.statSync(relFilename).isDirectory() && !relFilename.endsWith(this.themeDir)) {
                relDirPaths.push(relFilename);
            }
            else if (file.endsWith(extension)) {
                relFilenames.push(relFilename);
            }
        });
        onDirFiles(relDirPath, relFilenames);
        relDirPaths.forEach((dir) => {
            this.getFilenames(dir, extension, onDirFiles);
        });
    }
}
exports.StaticGen = StaticGen;
//# sourceMappingURL=staticgen.js.map