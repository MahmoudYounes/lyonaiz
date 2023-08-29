export class Pages {
    ModulePath: string;
    Title: string;
    Content: string;

    constructor(title: string, modulePath: string, content: string){
     this.ModulePath = modulePath;
     this.Title = title;
     this.Content = content;
    }
}
