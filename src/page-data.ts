import { Config } from "./config";

export class PageData {
  public url: string;
  public content: string;
  public frontMatter: any;
  public config: Config;
  public pages: PageData[];

  public PageData() {
    this.frontMatter = {
      template: null
    }
  }
}
