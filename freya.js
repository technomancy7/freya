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
        this.glob = new Glob("*");
        this.fmt = {
            "reset": '\033[0m',
            "red": Bun.color("red", "ansi"),
            "green": Bun.color("green", "ansi"),
            "blue": Bun.color("blue", "ansi"),
            "yellow": Bun.color("yellow", "ansi"),
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
            "loop_arrow": "↪",
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

    async download_file(url, out_path) {
        let filename = url.split("/").slice(-1)[0];
        console.log(`Downloading ${filename} to ${out_path}`)
        await $`curl --skip-existing --output ${out_path+filename} "${url}"`
        return out_path+filename, filename
    }
        
        
    async edit_file(path) {
        console.log("Opening", path, "in", process.env.EDITOR)
        await $`$EDITOR ${path}`;
    }
    
    coerce_type(input) {
        // Trim the input to remove extra whitespace
        const trimmedInput = input.trim();

        // Check for boolean values
        if (trimmedInput.toLowerCase() === "true") {
            return true;
        }
        if (trimmedInput.toLowerCase() === "false") {
            return false;
        }

        // Check for numeric values
        if (!isNaN(trimmedInput) && trimmedInput !== "") {
            return parseFloat(trimmedInput); // Converts to number (integer or float)
        }

        // Check for quoted strings
        if (
            (trimmedInput.startsWith('"') && trimmedInput.endsWith('"')) ||
            (trimmedInput.startsWith("'") && trimmedInput.endsWith("'"))
        ) {
            return trimmedInput.slice(1, -1); // Remove surrounding quotes
        }
        
        // Default to returning the original string
        return trimmedInput;
    }
    xeval(obj) {
        return eval?.(`"use strict";(${obj})`);
    }
    format_text(text) {
        for(const [name, colour] of Object.entries(this.fmt)) {
           text = text.replaceAll(`[${name}]`, colour); 
        }
        
        for(const [name, emoji] of Object.entries(this.emojis)) {
           text = text.replaceAll(`:${name}:`, emoji); 
        }
        
        return text;
    }
    writeln(text) {
        text = this.format_text(text);
        console.log(text);
    }
    
    async filter_choice(choices) {
        /*if(choices.length == 1) return choices[0]
        let fmt = [];
        for(const choice of choices){
            fmt.push(`"${choice}"`)
        }*/

        //const res = await $`gum filter ${{ raw: fmt.join(" ") }}`;
        //res.text().trim();
        const proc = Bun.spawn(["gum", "filter", ...choices]);
        const text = await new Response(proc.stdout).text();

        return text
    }
    
    async get_choice(choices) {
        /*if(choices.length == 1) return choices[0]
        let fmt = [];
        for(const choice of choices){
            fmt.push(`"${choice}"`)
        }
        const res = await $`gum choose ${{ raw: fmt.join(" ") }}`;
        return res.text().trim();*/
        const proc = Bun.spawn(["gum", "choice", ...choices]);
        const text = await new Response(proc.stdout).text();

        return text
    }
    
    
    async get_input(placeholder) {
        //const res = await $`gum input --placeholder "${placeholder}"`;
        //return res.text().trim();
        const proc = Bun.spawn(["gum", "input", "--placeholder", placeholder]);
        const text = await new Response(proc.stdout).text();

        return text
    }
    
    async write_panel(title, text) {
        text = this.format_text(text);
        await $`gum style --border double --width 50 "${this.fmt.bold}[${title}]${this.fmt.reset}" "${text}"`
    }
    
    async load_all_data(directory) {
        let output = {}

        for (const file of this.glob.scanSync(this.data_dir+directory)) {
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
    
    async execute(new_command = undefined) {
        const cmd_path = this.home+"/actions/"+this.command+".js";
        const file = Bun.file(cmd_path);
        const cmd_exists = await file.exists();
        
        if(this.command && !cmd_exists){
            return this.writeln("Command does not exist.")
        }
        
        if(this.args.help) {
            if(this.command) {
                const action = require(cmd_path);
                let act = new action.Action(this)
                this.writeln(`[bold]${act.help.title || this.command}[reset] (v${act.help.version} by ${act.help.author})`)
                this.writeln(act.help.text);
                if(act.help.commands){
                    this.writeln("\nCommands:")
                    for(const com of act.help.commands) {
                        if(com.includes(",")){
                            this.writeln("\t"+com.split(",")[0])
                            let help_line = com.split(",").slice(1).join(",");
                            this.writeln("\t  ↪ "+help_line)
                        } else {
                            this.writeln("\t"+com) 
                        }
                        
                    }
                }
                
                if(act.help.parameters){
                    this.writeln("\nParameters:")
                    for(const parm of act.help.parameters) {
                        //this.writeln("\t"+parm)
                        if(parm.includes(",")){
                            this.writeln("\t"+parm.split(",")[0])
                            let help_line = parm.split(",").slice(1).join(",");
                            this.writeln("\t  ↪ "+help_line)
                        } else {
                            this.writeln("\t"+parm) 
                        }
                    }
                }

                return;
            }else{
                this.writeln("Help on freya itself")
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
