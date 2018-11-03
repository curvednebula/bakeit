#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as finalHandler from 'finalhandler';
import * as http from 'http';
import * as serveStatic from 'serve-static';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';

import { Config } from "./config";
import { StaticGen } from './staticgen';


class App {

  private configFilename = './bakeit-config.json';
  private config:Config;

  public run() {

    var args: Array<string> = process.argv;
    var argsOffset = 2;

    var serve:boolean = false;

    switch (args[argsOffset]) {
      case 'init':
        var projName: string = '';
        if (args.length > argsOffset+1) {
          projName = args[argsOffset+1];
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

  private initBakeitProject(projName: string) {
    fse.copy(path.join(__dirname, '../init'), path.join('./', projName));
  }

  private bakeit(serve: boolean) {

    try {
      this.config = this.readConfig();
    } catch (err) {
      console.error(`ERROR: Can't find or error in ${this.configFilename}.`);
      console.error(err);
      process.exit(1);
    }

    if (this.config.sourceDir === undefined) {
      this.config.sourceDir = 'src';
    }

    if (this.config.outputDir === undefined) {
      this.config.outputDir = 'dist';
    }

    var gen = new StaticGen();
    gen.generate(this.config);

    if (serve) {
      this.startFileChangeWatcher(gen);
      this.startHttpServer();
    }
  }

  private readConfig(): Config {
    return JSON.parse(fs.readFileSync(this.configFilename).toString());
  }

  private printHelp() {
    console.log('Usage: bakeit [<cmd>]\n\n' +
      'Where <cmd>:\n' +
      '  init [<folder-name>] - init new bakeit project folder\n' +
      '  serve - runs HTTP server and re-generates site automatically on source files change\n' +
      '  help - this help info\n'
    );
  }

  private startFileChangeWatcher(gen: StaticGen) {
    // watch source dir ignoring .dotfiles and re-run generate
    chokidar
      .watch([this.config.sourceDir, this.configFilename], { 
        //ignored: /(^|[\/\\])\../,
        ignoreInitial: true
      })
      .on('all', (event, path) => {
        console.log(`\n${event}:`, path);
        try {
          this.config = this.readConfig();
          gen.generate(this.config);
        } catch (err) {
          console.error(err);
        }
      });
  }

  private startHttpServer() {

    var serveHandler = serveStatic(this.config.outputDir, {'index': ['index.html', 'index.htm']})

    var server = http.createServer(function onRequest (req, res) {
      serveHandler(req, res, finalHandler(req, res));
    });

    console.log('Starting HTTP server on http://localhost:8080');
    server.listen(8080);
  }
}

(new App()).run();
