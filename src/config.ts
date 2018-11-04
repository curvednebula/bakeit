
export class BuildOptions {
  sourceDir: string;
  outputDir: string;
  templateLanguage: 'handlebars' | 'mustache';
  templateFileExtension: string;
  sitemapPage: string;
  scripts: string[];
  styles: string[];
  copy: {src: string, dst: string}[];
}

export class Config {
  build: BuildOptions;
}
