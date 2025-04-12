export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "",
            "text": "",
            "commands": ["stats", "levelup [optional number]", "leveldown [optional number]", "gain <number>,Triggers EXP gain with defined value.", "exp <number>,Sets EXP value without triggering usual gains."],
            "parameters": [],
            "author": "",
            "version": "0.1"
        }
    }
    
    async gain_exp(exp) {
        let current_exp = this.ctx.get_config("rpg.exp", 0);
        let lvl = this.ctx.get_config("rpg.level", 1);
        let lvl_scale = this.ctx.get_config("rpg.level_scale", 100);
        current_exp = current_exp + exp;
        this.ctx.writeln(`[green]Gained ${exp} EXP.[reset] (Now ${current_exp}/${lvl*lvl_scale})`)
        if(current_exp > (lvl * lvl_scale)) {
            current_exp = current_exp - (lvl * lvl_scale)
            this.ctx.set_config("rpg.level", lvl + 1);
            this.ctx.writeln("Level up!");
        }
        this.ctx.set_config("rpg.exp", current_exp);
        await this.ctx.save_config()
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        let lvl = this.ctx.get_config("rpg.level", 1);
        let m = 1;
        
        switch(cmd) {
            case "stats":
                let exp = this.ctx.get_config("rpg.exp", 0);
                
                let lvl_scale = this.ctx.get_config("rpg.level_scale", 100);
                
                this.ctx.writeln(`Level: ${lvl} (${exp}/${lvl * lvl_scale} / * ${lvl_scale})`)
                break;
            
            case "levelup":
                m = Number(line) | 1;
                this.ctx.set_config("rpg.level", lvl + m);
                await this.ctx.save_config();
                this.ctx.writeln(`Changed level by +${m}. Now ${lvl+m}`)
                break;
                
            case "leveldown":
                m = Number(line) | 1;
                this.ctx.set_config("rpg.level", lvl - m);
                await this.ctx.save_config();
                this.ctx.writeln(`Changed level by -${m}. Now ${lvl-m}`)
                break;
                
            case "gain":
                await this.gain_exp(Number(line));
                break;
                
            case "exp":
                this.ctx.set_config("rpg.exp", Number(line));
                await this.ctx.save_config();
                this.ctx.writeln(`Set EXP to ${Number(line)}`)
                break;
            default:
                console.log("Unknown command")
                break;
        }
    }
}
