const argv = require('yargs-parser')(process.argv.slice(2))
import TOML from 'smol-toml'

class Context {
    constructor() {
        this.args = {}
        this.command = ""
        this.line = ""
        this.config = {}
        this.home = process.env.OVERRIDE_HOME || process.env.HOME+"/.freya/";
    }
    
    async load_data(directory, filename = "data") {
        let conf = await Bun.file(this.home+"/data/"+directory+"/"+filename+".toml").text();
        return TOML.parse(conf)
    }
    
    async save_data(store, directory, filename = "data") {
        await Bun.write(this.home+"/data/"+directory+"/"+filename+".toml", TOML.stringify(store));
    }
    
    async save_config() {
        await Bun.write(this.home+"/freya.toml", TOML.stringify(this.config));
    }
    
    async load_config() {
        let c = await Bun.file(this.home+"/freya.toml").text()
        this.config = TOML.parse(c)
    }
    
    set_config(key, value) {
        if(key.includes(".")) {
            let parent = key.split(".")[0];
            let sub = key.split(".")[1];
            
            if(this.config[parent] == undefined) this.config[parent] = {}
            this.config[parent][sub] = value;
            
        } else {
            this.config[key] = value;
        }
    }
    
    get_config(key, default_value = undefined) {
        if(key.includes(".")) {
            let parent = key.split(".")[0];
            let sub = key.split(".")[1];
            
            if(this.config[parent] == undefined) return default_value
            return this.config[parent][sub];
            
        } else {
            return this.config[key];
        }
    }
    
    process_args(args) {
        this.args = args;
        this.command = args._[0]
        this.line = args._.slice(1)
    }
    
    async execute() {
        const cmd_path = this.home+"/actions/"+this.command+".js";
        const file = Bun.file(cmd_path);
        const cmd_exists = await file.exists();
        
        if(this.command && !cmd_exists){
            return console.log("Command does not exist.")
        }
        
        if(this.args.help) {
            if(this.command) {
                const action = require(cmd_path);
                let act = new action.Action(this)
                console.log(act.help.text)
                return;
            }else{
                console.log("Help on freya itself")
                return;
            }

        }


        const action = require(cmd_path);
        let act = new action.Action(this)
        await act.on_execute()
    }
}
let ctx = new Context()
await ctx.load_config()

ctx.process_args(argv)
await ctx.execute()
