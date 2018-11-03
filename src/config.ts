
export class MenuItem {
  public name: string;
  public url: string;
};

export class Config {
  sourceDir: string;
  outputDir: string;
  menuItems: MenuItem[];
  duplicatePages: {src: string, dst: string}[];
}