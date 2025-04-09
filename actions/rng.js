export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "",
            "text": "Parses your input to automatically figure out what you're trying to randomize.",
            "commands": [
                "flip - Flips a join.",
                "xdx+x - Parse dice notation",
                "option,option,... - Selects from list",
                "x-x - RNG from range.",
                "x - RNG zero to x"
            ],
            "parameters": [
                "--json - Prints output in json (Only for dice)",
                "--filter x - Filters out dice rolls lower than x."
            ],
            "author": "Techno",
            "version": "0.9"
        }
    }
    
    dice_roll(formula) {
        let count = Number(formula.split("d")[0]);
        let modifiers = formula.split("d")[1];
        let sides = 0;
        let modifier = 0;
        if(modifiers.includes("+")){
            sides = Number(modifiers.split("+")[0]);
            modifier = Number(modifiers.split("+")[1])
        } else {
            sides = Number(modifiers)
        }
        
        let output = {
            "total": modifier,
            "modifier": modifier,
            "rolls": [],
            "filter": this.ctx.args.filter || null
        };

        for(let i = 0; i < count; i++){
            let roll = this.random(1, sides);
            output.rolls.push(roll)
            if(output.filter && roll < output.filter) continue;
            output.total += roll;
            
        }
        
        return output;

    }
    
    random(min,max) {
        return Math.floor((Math.random())*(max-min+1))+min;
    }

    async on_execute() {
        let line = this.ctx.line.join(" ");
        if(!line) line = "flip";
        
        if(line == "flip"){
            if(Math.random() >= 0.5) {
                this.ctx.writeln("Heads!");
            } else {
                this.ctx.writeln("Tails!");
            }
            
        } else if(line.includes("d")) {
            let result = this.dice_roll(line)
            if(this.ctx.args.json) 
                console.log(result)
            else
                this.ctx.writeln(`${result.total}`)
            
        } else if(line.includes(",")) {
            const options = line.split(",");
            const randomElement = options[Math.floor(Math.random() * options.length)];
            this.ctx.writeln(`${randomElement.trim()}`)
            
        } else if(line.includes("-")) {
            this.ctx.writeln(`${this.random(Number(line.split("-")[0]), Number(line.split("-")[1]))}`)
            
        } else {
            if(isNaN(line)) {
                console.log("isnan", line)
                this.ctx.writeln(`${this.random(0, 100)}`)
            } else {
                console.log("not nan", line)
                this.ctx.writeln(`${this.random(0, Number(line))}`)
            }
        }
    }
}
