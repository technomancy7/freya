export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "text": "Repeats your input back to you."
        }
    }
    
    async on_execute() {
        const line = this.ctx.line.join(" ");
        console.log(line)
    }
}
