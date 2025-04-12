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
                if(this.ctx.args.edit) {
                    this.ctx.edit_file(`${this.ctx.home}freya.toml`)
                    return;
                }
                for (const [key, value] of Object.entries(this.ctx.config)) {
                    console.log(key, value)
                    
                }
                break;
                
            case "get":
                const c = this.ctx.get_config(params[0]);
                this.ctx.writeln(`${params[0]} = ${c}`)
                break;
                
            case "set":
                console.log("Setting", params[0], "=", params[1]);
                this.ctx.set_config(params[0], params[1])
                await this.ctx.save_config();
                break;
                
        }
    }
}
