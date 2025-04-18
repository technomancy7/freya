import { $ } from "bun";
//TODO
//make the set command only take key.value and use --db to specify file, use "default" if not given
export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "Codex",
            "text": "Generic data storage and retrieval.",
            "commands": ["list", "set,Format: db.parent.key = value", "get,Format: entry_name[.key]", "edit,Opens given database file in default editor."],
            "parameters": ["--json,Changes output to json instead of formatting", "--filter [key==value or key!=value]", "--open [key],If used on get, opens key in browser."],
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
                            output.push(`[green]${key}[reset] = [cyan]"${ts.fromNow()}"[reset] (${val.slice(2)})`)
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
        const cmd = this.ctx.line[0] || "ls";
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        let db = this.ctx.args.db;
        let data = {}

        switch (cmd) {
            case 'list':
            case 'ls':
                data = await this.ctx.load_all_data("codex")
                
                if(db && typeof db == "string") {
                    for (const [key, value] of Object.entries(data[db])) {
                        if(!this.checkFilter(value)) continue;
                        if(!value.hidden) {
                            value._key_ = key;
                            value._parent_ = db;
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
                let spec_key = undefined;
                
                if(line.includes(".")) {
                    pointer = line.split(".")[0];
                    spec_key = line.split(".")[1];
                }
                
                data = await this.ctx.load_all_data("codex");

                for (const [parent, datafile] of Object.entries(data)) {
                    if(db && db != parent) continue;
                    for (const [key, value] of Object.entries(datafile)) {
                        if(value._self_ && value._self_.hidden == true) continue;
                        if(!this.checkFilter(value)) continue;
                        
                        if(key == pointer) {
                            if(spec_key) {
                                if(this.ctx.args.open) {
                                    await $`xdg-open ${value[spec_key]}`;
                                } else {
                                    this.ctx.writeln(`${key}.${spec_key} = ${value[spec_key]}`);
                                }
                               
                            } else {
                                if(this.ctx.args.open) {
                                    await $`xdg-open ${value[this.ctx.args.open]}`;
                                    return;
                                } 
                                value._key_ = key;
                                value._parent_ = parent;
                                await this.format_entry(value);
                                return;
                            }

                        }
                    }
                }
                break;
            
            case "set":
                data = await this.ctx.load_all_data("codex")
                if(!db) db = "default"
                let parent = params[0].split(".")[0].trim();
                let sub = params[0].split(".")[1].trim();
                let val = this.ctx.coerce_type(params.slice(1).join(" ").trim());
                if(data[db] == undefined) data[db] = {}
                if(data[db][parent] == undefined) data[db][parent] = {}
                data[db][parent][sub] = val;
                await this.ctx.save_data(data[db], "codex", db)
                this.ctx.writeln(`${db}.${parent}.${sub} = ${val} (${typeof val})`)
                break;
                
            case "unset":
                data = await this.ctx.load_all_data("codex")
                if(!db) db = "default"
                let uparent = line.split(".")[0].trim();
                let usub = line.split(".")[1].trim();
                if(data[db] == undefined) return this.ctx.writeln("Entry does not exist.")
                if(data[db][uparent] == undefined) return this.ctx.writeln("Entry does not exist.")
                delete data[db][uparent][usub];
                this.ctx.writeln(`Removed key.`)
                await this.ctx.save_data(data[db], "codex", db)
                break;
                
            case "delete":
            case "del":
                let dbf = Bun.file(`${this.ctx.home}/data/codex/${line}.toml`)
                let exists = await dbf.exists();
                if(!exists) return this.ctx.writeln("File not found.")
                if(confirm(`Really delete database [${line}]?`)) {
                    await dbf.delete();
                }
                break;
                
            case "edit":
                await this.ctx.edit_file(this.ctx.data_dir+"/codex/"+line+".toml")
                break
                
            default:
                this.ctx.write_panel(':right_arrow: [strike_through]Unknown [red]command[reset].');
        }

    }
}
