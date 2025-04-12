export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "Codex",
            "text": "Generic data storage and retrieval.",
            "commands": ["list", "set,Format: db.parent.key = value", "get,Format: [database.]entry_name", "edit,Opens given database file in default editor."],
            "parameters": ["--json,Changes output to json instead of formatting", "--filter [key==value or key!=value]"],
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
                        if(val.startsWith("@ ")) {
                            let ts = this.ctx.dayjs(val.slice(2), "DD-MM-YYYY")

                            //if(ts.isBefore(this.ctx.dayjs()))
                                //output.push(`[green]${key}[reset] = [yellow]"< ${ts.fromNow()}"[reset]`)
                            //else
                            output.push(`[green]${key}[reset] = [cyan]"${ts.fromNow()}"[reset]`)
                        } else {
                            output.push(`[green]${key}[reset] = [yellow]"${val}"[reset]`)
                        }
                        
                    }
                } else if(typeof val == "number" || typeof val == "boolean") {
                    output.push(`[green]${key}[reset] = [yellow]${val}[reset]`)
                } else if(typeof val == "object" || val.isArray()) {
                    output.push(`[green]${key}[reset]:`)
                    for(const line of val) {
                        if(line.startsWith("x ")) {
                            output.push(` - [[green]X[reset]] [yellow]"${line.slice(2)}"[reset]`);
                        } else {
                            output.push(` - [ ] [yellow]"${line}"[reset]`);
                        }
                        
                    }
                }
            }
            this.ctx.write_panel(data._parent_+"."+data._key_, output.join("\n"))
        }
    }
    
    checkFilter(data) {
        let filter = this.ctx.args.filter;
        if(!filter) return true;
        let filter_type = "";
        let filter_key = "";
        let filter_value = "";
        
        if(filter.includes("==")) {
            filter_type = "==";
            filter_key = filter.split("==")[0].trim();
            filter_value = filter.split("==")[1].trim();
        }
        
        if(filter.includes("!=")) {
            filter_type = "!=";
            filter_key = filter.split("!=")[0].trim();
            filter_value = filter.split("!=")[1].trim();
        }

        if(filter_type == "=="){
            return data[filter_key] == filter_value;
        }
        if(filter_type == "!="){
            return data[filter_key] != filter_value;
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
                        if(!this.checkFilter(value)) continue;
                        if(!value.hidden) {
                            value._key_ = key;
                            value._parent_ = line;
                            await this.format_entry(value);
                        }
                    }
                } else {
                    for (const [parent, datafile] of Object.entries(data)) {
                        for (const [key, value] of Object.entries(datafile)) {
                            if(value._self_ && value._self_._hidden_ == true) continue;
                            if(!this.checkFilter(value)) continue;
                            if(!value._hidden_) {
                                value._key_ = key;
                                value._parent_ = parent;
                                await this.format_entry(value);
                            }
                        }
                    } 
                }

                break;
                
            case 'get':
                let pointer = line;
                let ptrdb = undefined;
                
                if(line.includes(".")) {
                    pointer = line.split(".")[1];
                    ptrdb = line.split(".")[0];
                }
                data = await this.ctx.load_all_data("codex")
                for (const [parent, datafile] of Object.entries(data)) {
                    if(ptrdb && ptrdb != parent) continue;
                    for (const [key, value] of Object.entries(datafile)) {
                        if(value._self_ && value._self_.hidden == true) continue;
                        if(!this.checkFilter(value)) continue;
                        if(key == pointer) {
                            value._key_ = key;
                            value._parent_ = parent;
                            await this.format_entry(value);
                            return;
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
                
            default:
                this.ctx.write_panel(':right_arrow: [strike_through]Unknown [red]command[reset].');
        }

    }
}
