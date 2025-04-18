const argv = require('yargs-parser')(process.argv.slice(2))
import TOML from 'smol-toml'
import { Glob } from "bun";
import { $ } from "bun";
const dayjs = require('dayjs')
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime)
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const FREYA_VERSION = "25.04.12"

class Context {
    constructor() {
        this.dayjs = dayjs;
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
            "cyan":Bun.color("cyan", "ansi"),
            "orange":Bun.color("orange", "ansi"),
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
    
    randomAlphaNumeric(length) {
        let s = '';
        Array.from({ length }).some(() => {
            s += Math.random().toString(36).slice(2);
            return s.length >= length;
        });
        return s.slice(0, length);
    };

    async download_file(url, out_path) {
        let filename = url.split("/").slice(-1)[0];
        console.log(`Downloading ${filename} to ${out_path}`)
        await $`curl --skip-existing --output ${out_path+filename} "${url}"`
        return out_path+filename, filename
    }
        
        
    async edit_file(path) {
        let editor = this.get_config("tools.editor")
        console.log("Opening", path, "in tools.editor: ", editor)
        await $`${editor} ${path}`;
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
        await $`gum style --border double "${this.fmt.bold}[${title}]${this.fmt.reset}" "${text}"`
        
        //const proc = Bun.spawn(["gum", "style", "--border", "double", "--width", 50, `${this.fmt.bold}[${title}]${this.fmt.reset}`, text ]);
        //const out = await new Response(proc.stdout).text();
        //console.log(out)
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
        let confile = Bun.file(this.home+"/data/"+directory+"/"+filename+".toml")
        let exists = await confile.exists();
        if(exists) {
            let text = await confile.text();
            return TOML.parse(text)
        } else return {}
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
            if(this.config[parent][sub] == undefined) return default_value
            return this.config[parent][sub];
            
        } else {
            return this.config[key] || default_value;
        }
    }
    
    incr(key, m = 1) {
        let v = this.get_config(key, 1);
        this.set_config(key, v + m);
        return v + m;
    }
    
    decr(key, m = 1) {
        let v = this.get_config(key, 1);
        this.set_config(key, v - m);
        return v - m;
    }
    
    process_args(args) {
        this.args = args;
        this.command = args._[0]
        this.line = args._.slice(1)
    }
    
    get_action(name) {
        const cmd_path = this.home+"/actions/"+name+".js";
        const action = require(cmd_path);
        let act = new action.Action(this);
        return act;
    }
    
    clone() {
        //return structuredClone(this)
        let ctx = new Context()
        ctx.config = this.config;
        
        return ctx;
    }
    
    say(text, tts = false) {
        //TTS NOT YET IMPLEMENTED
        let name = this.get_config("self.name", "Freya");
        this.writeln(`([green]${name}[reset])> ${text}`)
    }
    
    async get_user_name() {
        let codex = await this.load_data("codex", "addrbook")
        return codex.self["Display Name"] || codex.self.name || "self.user";
    }
    
    async repl() {
        let all_actions = [];
        for (const file of this.glob.scanSync(this.home+"actions")) {
            let key = file.split(".")[0].toLowerCase();
            all_actions.push(key)
        }
        const username = await this.get_user_name();
        this.say(`Interactive mode activated. What is your request, ${username}?`)
        process.on("SIGINT", async () => { process.exit() });
        
        async function cleanup() { process.exit() }
        
        while(true) {
            try {
                const prompt = "(> ";
                process.stdout.write(prompt);
                for await (const line of console) {
                    this.writeln(`([blue]${username}[reset])> ${line}`);
                    
                    if(line == ".q" || line == "quit") {this.say("Goodbye.");await cleanup();}
                    
                    if(all_actions.includes(line.split(" ")[0])) {
                        await this.execute(line)
                    } else {
                        if(line.split(" ")[0] == "cd") { 
                            await $.cwd(line.split(" ").slice(1).join(" ")); 
                        } else {
                           await $`${line}` 
                        }
                        
                    }
                    process.stdout.write(prompt);
                }
                
            } catch (e) {
                console.error(`Exited. ${e.name} ${e.message}`);
                process.exit()
            }
        }
        console.log("Ended")
    }
    
    async execute(new_command = undefined) {
        if(new_command) {
            this.command = new_command.split(" ")[0];
            this.line =  new_command.split(" ").slice(1);
        }
        if(this.command == undefined) {
            this.args.help = true;
        }
        const alias = await this.get_config("aliases."+this.command)
        if(alias) this.command = alias;
        if(this.command == "repl"){
            await this.repl();
            return;
        }
            
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
                if(act.help.commands && act.help.commands.length >= 1){
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
                
                if(act.help.parameters && act.help.parameters.length >= 1){
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
                this.writeln("FREYA.CLI."+FREYA_VERSION)
                this.writeln("\nActions:")
                for (const file of this.glob.scanSync(this.home+"actions")) {
                    let key = file.split(".")[0].toLowerCase();
                    this.writeln("\t"+key)
                }
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
