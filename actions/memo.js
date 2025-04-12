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
        const input = this.ctx.line.join(" ")
        if(input) {
            this.ctx.set_config("memo.text", input);
            await this.ctx.save_config();
        } else {
            const memo = this.ctx.get_config("memo.text");
            if(memo)
                this.ctx.writeln(memo)
            else
                this.ctx.writeln("None.")
        }
    }
}
