const argv = require('yargs-parser')(process.argv.slice(2))
import TOML from 'smol-toml'
import { Glob } from "bun";
import { $ } from "bun";

class Context {
    constructor() {
        this.args = {}
        this.command = ""
        this.line = []
        this.config = {}
        this.home = process.env.OVERRIDE_HOME || process.env.HOME+"/.freya/";
        this.data_dir = this.home+"/data/"
        
        this.fmt = {
            "reset": '\033[0m',
            "red": Bun.color("red", "ansi"),
            "green": Bun.color("green", "ansi"),
            "bold": "\u001b[1m",
            "dim": "\u001b[2m",
            "italic": "\u001b[3m",
            "underline": "\u001b[4m",
            "blink": "\u001b[5m",
            "reverse": "\u001b[7m",
            "hidden": "\u001b[8m",
            "strike_through": "\u001b[9m",
        }
        this.emojis = {
            "right_arrow": "➡️",
            "smile": "😊",
            "heart": "❤️",
            "thumbs_up": "👍",
            "clap": "👏",
            "fire": "🔥",
            "star": "⭐",
            "check_mark": "✔️",
            "wave": "👋",
            "laugh": "😂",
            "wink": "😉",
            "cry": "😢",
            "angry": "😡",
            "party": "🥳",
            "thinking": "🤔",
            "sunglasses": "😎",
            "kiss": "😘",
            "hug": "🤗",
            "sleepy": "😴",
            "poop": "💩",
            "rocket": "🚀"
        }
    }
    
    format_text(text) {
        for(const [name, colour] of Object.entries(this.fmt)) {
           text = text.replace(`[${name}]`, colour); 
        }
        
        for(const [name, emoji] of Object.entries(this.emojis)) {
           text = text.replace(`:${name}:`, emoji); 
        }
        
        return text;
    }
    writeln(text) {
        text = this.format_text(text);
        console.log(text);
    }
    
    async get_input(placeholder) {
        const res = await $`gum input --placeholder "${placeholder}"`;
        return res.text().trim();
    }
    
    async write_panel(text) {
        text = this.format_text(text);
        await $`gum style --border normal "${text}"`
    }
    async load_all_data(directory) {
        let output = {}
        
        const glob = new Glob("*");

        for (const file of glob.scanSync(this.data_dir+directory)) {
            let key = file.split(".")[0];
            output[key] = await this.load_data(directory, key)
        }
        return output;
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
