import { $ } from "bun";

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
        const line = this.ctx.line.join(" ");
        const data = await this.ctx.load_data("search")
        
        if(this.ctx.args.e){
            let engine_url = data.engines[this.ctx.args.e].url;
            engine_url = engine_url.replace("{search}", encodeURI(line))
            await $`xdg-open ${engine_url}`
        }
    }
}
