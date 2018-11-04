#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const finalHandler = require("finalhandler");
const http = require("http");
const serveStatic = require("serve-static");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const staticgen_1 = require("./staticgen");
class App {
    constructor() {
        this.configFilename = './bakeit-config.json';
    }
    run() {
        var args = process.argv;
        var argsOffset = 2;
        var serve = false;
        switch (args[argsOffset]) {
            case 'init':
                var projName = '';
                if (args.length > argsOffset + 1) {
                    projName = args[argsOffset + 1];
                }
                this.initBakeitProject(projName);
                break;
            case 'serve':
                this.bakeit(true);
                break;
            case 'help':
                this.printHelp();
                break;
            default:
                this.bakeit(false);
                break;
        }
    }
    initBakeitProject(projName) {
        fse.copy(path.join(__dirname, '../init'), path.join('./', projName));
    }
    bakeit(serve) {
        try {
            this.config = this.readConfig();
        }
        catch (err) {
            console.error(`ERROR: Can't find or error in ${this.configFilename}.`);
            console.error(err);
            process.exit(1);
        }
        if (this.config.build.sourceDir === undefined) {
            this.config.build.sourceDir = 'src';
        }
        if (this.config.build.outputDir === undefined) {
            this.config.build.outputDir = 'dist';
        }
        var gen = new staticgen_1.StaticGen();
        gen.generate(this.config);
        if (serve) {
            this.startFileChangeWatcher(gen);
            this.startHttpServer();
        }
    }
    readConfig() {
        return JSON.parse(fs.readFileSync(this.configFilename).toString());
    }
    printHelp() {
        console.log('Usage: bakeit [<cmd>]\n\n' +
            'Where <cmd>:\n' +
            '  init [<folder-name>] - init new bakeit project folder\n' +
            '  serve - runs HTTP server and re-generates site automatically on source files change\n' +
            '  help - this help info\n');
    }
    startFileChangeWatcher(gen) {
        // watch source dir ignoring .dotfiles and re-run generate
        chokidar
            .watch([this.config.build.sourceDir, this.configFilename], {
            //ignored: /(^|[\/\\])\../,
            ignoreInitial: true
        })
            .on('all', (event, path) => {
            console.log(`\n${event}:`, path);
            try {
                this.config = this.readConfig();
                gen.generate(this.config);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    startHttpServer() {
        var serveHandler = serveStatic(this.config.build.outputDir, { 'index': ['index.html', 'index.htm'] });
        var server = http.createServer(function onRequest(req, res) {
            serveHandler(req, res, finalHandler(req, res));
        });
        console.log('Starting HTTP server on http://localhost:8080');
        server.listen(8080);
    }
}
(new App()).run();
//# sourceMappingURL=main.js.map