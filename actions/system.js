export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "text": "System commands.",
            "version": "0.1",
            "author": "Techno"
        }
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        switch(cmd) {
            case "new":
                let template = await Bun.file(this.ctx.home+"/template.js").text();
                
                await Bun.write(this.ctx.home+"/actions/"+line+".js", template);
                
                break;
        }
    }
}
