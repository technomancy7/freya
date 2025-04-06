export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "text": ""
        }
    }
    async format_entry(data) {
        console.log(data._key_, "on", data)
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        let data = {}
        
        switch (cmd) {
            case 'list':
            case 'ls':
                data = await this.ctx.load_all_data("codex")
                for (const [parent, datafile] of Object.entries(data)) {
                    for (const [key, value] of Object.entries(datafile)) {
                        if(value._self_ && value._self_.hidden == true) continue;
                        if(!value.hidden) {
                            value._key_ = key;
                            await this.format_entry(value);
                        }
                    }
                }
                break;
                
            case 'get':
                data = await this.ctx.load_all_data("codex")
                for (const [parent, datafile] of Object.entries(data)) {
                    for (const [key, value] of Object.entries(datafile)) {
                        if(value._self_ && value._self_.hidden == true) continue;
                        if(key == params.join(" ")) {
                            value._key_ = key;
                            await this.format_entry(value);
                        }
                    }
                }
                break;
            
            case "set":
            case "edit":
            case "search":
                console.log("Not yet implemented.");
                break;
                
            default:
                this.ctx.write_panel(':right_arrow: [strike_through]Unknown [red]command[reset].');
        }

    }
}
