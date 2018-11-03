
export class MenuItem {
  public name: string;
  public url: string;
};

export class BuildOptions {
  assets: string[];
  scripts: string[];
  styles: string[];
  sitemapPage: string;
  copy: {src: string, dst: string}[];
}

export class Config {
  sourceDir: string;
  outputDir: string;
  menuItems: MenuItem[];
  build: BuildOptions;
}
