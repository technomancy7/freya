export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "text": "System commands.",
            "version": "0.1",
            "author": "Techno",
            "commands": [
                "new",
                "get <config code>",
                "set <config code> <value>",
                "increment, Also `incr`, increases config int value.",
                "decrement, Also `decr`, decreases config int value.",
                "config,Prints config file."
            ],
            "parameters": ["--edit,When given with config, opens config file in text editor ($EDITOR)."]
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
                
            case "exec":
                let new_ctx = this.ctx.clone()
                new_ctx.execute(line)
                break;
                
            case "alert":
                alert(line)
                break;
                
            case "config":
                
                this.ctx.edit_file(`${this.ctx.home}freya.toml`)
                break;
                
            case "increment":
            case "incr":
                let incv = Number(params[1]) || 1;
                let inv = this.ctx.incr(params[0], incv);
                this.ctx.writeln(`Incr ${params[0]} + ${incv} = ${inv}`)
                await this.ctx.save_config();
                break;
                
            case "decrement":
            case "decr":
                let decv = Number(params[1]) || 1;
                let dnv = this.ctx.decr(params[0], decv)
                this.ctx.writeln(`Decr ${params[0]} - ${decv} = ${dnv}`)
                await this.ctx.save_config();
                break;
                
                
            case "get":
                if(!params[0]) {
                    for (const [key, value] of Object.entries(this.ctx.config)) {
                        console.log(key, value)
                    }
                    return
                }
                
                const c = this.ctx.get_config(params[0]);
                if(typeof c == "object") {
                    for(const [key, val] of Object.entries(c)) {
                       this.ctx.writeln(`[orange]${params[0]}[reset].[orange]${key}[reset] = [orange]${val}[reset]`) 
                    }
                } else {
                    this.ctx.writeln(`[orange]${params[0]}[reset] = [orange]${c}[reset]`)
                }
                
                break;
                
            case "set":
                let v = this.ctx.coerce_type(params[1])
                this.ctx.writeln(`[orange]${params[0]}[reset] = [orange]${params[1]}[reset] (${typeof v})`);
                this.ctx.set_config(params[0], v)
                await this.ctx.save_config();
                break;
                
        }
    }
}
