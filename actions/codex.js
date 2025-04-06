export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "Codex",
            "text": "Generic data storage and retrieval.",
            "commands": ["list", "set", "get", "edit"],
            "parameters": ["--json (Changes output to json instead of formatting)"],
            "author": "Techno",
            "version": "0.4"
        }
    }
    async format_entry(data) {
        if(this.ctx.args.json)
            console.log(data)
        else {
            let output = [];
            for(let [key, val] of Object.entries(data)){
                if(typeof val == "string") {
                    val = val.trim()
                    if(key.startsWith("_") && key.endsWith("_")) continue;
                    if(val.includes("\n")) {
                        let i = 0;
                        for(const line of val.split("\n")) {
                            output.push(`[green]${key}[reset][${i}] = [yellow]"${line}"[reset]`);
                            i = i + 1;
                        }
                    } else {
                        output.push(`[green]${key}[reset] = [yellow]"${val}"[reset]`)
                    }
                } else if(typeof val == "number" || typeof val == "boolean") {
                    output.push(`[green]${key}[reset] = [yellow]${val}[reset]`)
                } else if(typeof val == "object" || val.isArray()) {
                    for(const line of val) {
                        output.push(`[green]${key}[reset][ ] = [yellow]"${line}"[reset]`);
                    }
                }
            }
            this.ctx.write_panel(data._key_, output.join("\n"))
        }
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        let data = {}
        
        switch (cmd) {
            case 'list':
            case 'ls':
                data = await this.ctx.load_all_data("codex")
                if(line) {
                    for (const [key, value] of Object.entries(data[line])) {
                        if(value._self_ && value._self_._hidden_ == true) continue;
                        if(!value.hidden) {
                            value._key_ = key;
                            await this.format_entry(value);
                        }
                    }
                } else {
                    for (const [parent, datafile] of Object.entries(data)) {
                        for (const [key, value] of Object.entries(datafile)) {
                            if(value._self_ && value._self_._hidden_ == true) continue;
                            if(!value._hidden_) {
                                value._key_ = key;
                                await this.format_entry(value);
                            }
                        }
                    } 
                }

                break;
                
            case 'get':
                data = await this.ctx.load_all_data("codex")
                for (const [parent, datafile] of Object.entries(data)) {
                    for (const [key, value] of Object.entries(datafile)) {
                        if(value._self_ && value._self_.hidden == true) continue;
                        if(key == line) {
                            value._key_ = key;
                            await this.format_entry(value);
                        }
                    }
                }
                break;
            
            case "set":
                data = await this.ctx.load_all_data("codex")
                let db = line.split("=")[0].split(".")[0].trim();
                let parent = line.split("=")[0].split(".")[1].trim();
                let sub = line.split("=")[0].split(".")[2].trim();
                let val = this.ctx.coerce_type(line.split("=").slice(1).join("=").trim());
                if(data[db] == undefined) data[db] = {}
                if(data[db][parent] == undefined) data[db][parent] = {}
                data[db][parent][sub] = val;
                await this.ctx.save_data(data[db], "codex", db)
                break;
                
            case "edit":
                await this.ctx.edit_file(this.ctx.data_dir+"/codex/"+line+".toml")
                break
                
            case "search":
                console.log("Not yet implemented.");
                break;
                
            default:
                this.ctx.write_panel(':right_arrow: [strike_through]Unknown [red]command[reset].');
        }

    }
}
