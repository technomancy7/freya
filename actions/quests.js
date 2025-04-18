export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "quest manager",
            "text": "Gameify todo lists!",
            "commands": ["new <text>,Create a new quest.", "list,Lists existing quests.", "delete <id>,Deletes given quest.", "complete <id>,Completes given quest.", "edit [key],Either opens data file in editor, or changes --key, --exp or --text of quest if key is given."],
            "parameters": ["--exp <number>,How much EXP the quest gives when completed.","--completed,When given with the delete command, deletes all completed quests.", "-a,When given with list command, shows completed quests.", "--t <tags>,Filters list output to only show tagged items."],
            "author": "",
            "version": "0.1"
        }
    }
    
    arraysMatch(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    async print_quest(quest) {
        let ts = this.ctx.dayjs(quest.ts).fromNow();
        let exp = "";
        let pre = "";
        let pos = "";
        if(quest.completed){pre = "[strike_through]"; pos = "[reset]"}
        if(quest.exp) exp = `\n[green](EXP: +${quest.exp})[reset]`;
        const text = quest.text.replace(/#[^\s#]+/g, '').replace(/\s{2,}/g, ' ').trim();
        const tags = quest.text.match(/#[\w]+/g) || [];
        await this.ctx.write_panel(`${quest.key} -> ${ts}`, `${pre}${text}${pos}${exp} [red]${tags.join(" ")}[reset]`)
    }

    
    async on_execute() {
        const cmd = this.ctx.line[0] || "ls";
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        const data = await this.ctx.load_data("quests");

        switch(cmd) {
            case "edit":
            case "e":
                if(line) {
                    if(data[line]) {
                        let key = line;
                        if(this.ctx.args.exp) data[key].exp = parseInt(this.ctx.args.exp)
                        if(this.ctx.args.text) data[key].text = this.ctx.args.text;
                        if(this.ctx.args.key) {
                            data[this.ctx.args.key] = data[key]
                            delete data[key];
                            key = this.ctx.args.key;
                        }
                        await this.ctx.save_data(data, "quests");
                        
                        data[key].key = key;
                        await this.print_quest(data[key]);
                        this.ctx.writeln(`Quest updated.`);
                        
                    } else {
                        this.ctx.writeln("Quest not found.")
                    }
                } else {
                   await this.ctx.edit_file(this.ctx.data_dir+"/quests/data.toml") 
                }
                
                break;
                
            case "n":
            case "new":
            case "add":
                let new_quest = {
                    "text": line,
                    "exp": Number(this.ctx.args.exp) || 0,
                    "ts": this.ctx.dayjs().format() 
                }
                let key = this.ctx.args.key || this.ctx.randomAlphaNumeric(5);
                while(Object.keys(data).includes(key)) key = this.ctx.randomAlphaNumeric(5);
                
                data[key] = new_quest;
                await this.ctx.save_data(data, "quests")
                this.ctx.writeln(`New quest added. [red](${key})[reset]`)
                new_quest.key = key;
                await this.print_quest(new_quest)
                break;
            
            case "delete":
            case "del":
                if(this.ctx.args.completed) {
                    for(const [key, quest] of Object.entries(data)) {
                        if(quest.completed) {
                            await this.print_quest(quest)
                            delete data[key]
                            this.ctx.writeln(`Quest ${key} deleted.`)   
                        }
                    }
                    await this.ctx.save_data(data, "quests")
                } else {
                    if(data[line]) {
                        await this.print_quest(data[line])
                        delete data[line];
                        await this.ctx.save_data(data, "quests")
                        this.ctx.writeln(`Quest deleted.`)                        
                    } else {
                        this.ctx.writeln("Quest not found.")
                    }
                }
                break;
                
            case "complete":
            case "c":
            case "done":
                if(data[line]) {
                    if(data[line].completed) this.ctx.writeln("Quest already complete.");
                    else {
                        data[line].completed = true
                        await this.ctx.save_data(data, "quests")
                        this.ctx.writeln(`Quest complete!`)
                        if(data[line].exp) {
                            await this.ctx.get_action("rpg").gain_exp(data[line].exp)
                            
                        }
                    }
                    
                } else {
                    this.ctx.writeln("Quest not found.")
                }
                break;
                
            case "list":
            case "ls":
                if(this.ctx.args.t) {
                    const search = this.ctx.args.t.split(",").map(item => `#${item}`);

                    for(const [key, quest] of Object.entries(data)) {
                        const tags = quest.text.match(/#[\w]+/g) || [];
                        if(quest.completed && !this.ctx.args.a) continue;
                        if(!this.arraysMatch(tags, search)) continue;
                        quest.key = key
                        await this.print_quest(quest)
                    }
                    
                } else {
                    for(const [key, quest] of Object.entries(data)) {
                        if(quest.completed && !this.ctx.args.a) continue;
                        quest.key = key
                        await this.print_quest(quest)
                    }
                }
                
   
                break;
                
            default:
                console.log("Unknown command")
                break;
        }
    }
}
