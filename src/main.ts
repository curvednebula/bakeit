#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as finalHandler from 'finalhandler';
import * as http from 'http';
import * as serveStatic from 'serve-static';
import * as fs from 'fs';

import { Config } from "./config";
import { StaticGen } from './staticgen';


class App {

  private config:Config;

  public run() {

    var args: Array<string> = process.argv;
    var argsOffset = 2;

    var serve:boolean = false;

    switch (args[argsOffset]) {
      case 'serve': 
        serve = true; 
        break;

      case 'help': 
        this.printHelp();
        process.exit();
    }

    var configFilename = 'bakeit-config.json';

    try {
      this.config = JSON.parse(fs.readFileSync(configFilename).toString());
    } catch (err) {
      console.error(`ERROR: Can't find or error in ${configFilename}.`);
      console.error(err);
      process.exit(1);
    }

    if (this.config.sourceDir === undefined) {
      this.config.sourceDir = 'src';
    }

    if (this.config.outputDir === undefined) {
      this.config.outputDir = 'dist';
    }

    var gen = new StaticGen(this.config);
    gen.generate();

    if (serve) {
      this.startFileChangeWatcher(gen);
      this.startHttpServer();
    }
  }

  private startFileChangeWatcher(gen: StaticGen) {
    // watch source dir ignoring .dotfiles and re-run generate
    chokidar
      .watch(this.config.sourceDir, { 
        //ignored: /(^|[\/\\])\../,
        ignoreInitial: true
      })
      .on('all', (event, path) => {
        console.log(`\n${event}:`, path);
        try {
          gen.generate();
        } catch (err) {
          console.error(err);
        }
      });
  }

  private printHelp() {
    console.log('Usage: bakeit [<cmd>]\n\n' +
      'Where <cmd>:\n' +
      '  serve - runs HTTP server and re-generates site automatically on source files change\n' +
      '  help - this help info\n'
    );
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
