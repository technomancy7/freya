export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "",
            "text": "",
            "commands": [],
            "parameters": [],
            "author": "",
            "version": "0.1"
        }
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        switch(cmd) {
            case "test":
                console.log("Tested.")
                break;
            
            default:
                console.log("Unknown command")
                break;
        }
    }
}
