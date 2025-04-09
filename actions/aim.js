import { $ } from "bun";

export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "",
            "text": "",
            "commands": [],
            "parameters": [],
            "author": "",
            "version": "0.1"
        }
    }
    
    async run_application(ctx, path) {
        ctx.writeln("[yellow] Starting application: "+path)
        const { stdout, stderr, exitCode } =  await $`${aim_dir+path} ${params}`.nothrow();
        ctx.writeln("[yellow]Application ended.[reset]")
        if (exitCode !== 0) {
            ctx.writeln(`[red]Ended with exit code[reset]: ${exitCode}`);
        }

        if(stdout.toString()) ctx.writeln(stdout.toString());
        if(stderr.toString()) ctx.writeln(stderr.toString());
    }
                
    async on_execute() {
        const cmd = this.ctx.line[0];
        const aim_dir = this.ctx.get_config("aim.directory", "")

        if(!aim_dir) return this.ctx.writeln("No `aim.directory` variable defined.")
            
        switch(cmd) {
            case "run":
                const appname = this.ctx.line[1]
                const params = process.argv.slice(5).join(" ")
                
                if(!aim_dir) return this.ctx.writeln("No `aim.directory` variable defined.")
                
                
                let options = [];
                for (const file of this.ctx.glob.scanSync(aim_dir)) {
                    let key = file.split(".")[0].toLowerCase();
                    if(key.startsWith(appname.toLowerCase()) || key == appname.toLowerCase()) {
                        options.push(file)
                    }
                }
                

                if(options.length == 0) {
                    this.ctx.writeln("No application found.")
                } else if(options.length == 1) {
                    await this.run_application(this.ctx, options[0])
                } else {
                    let choice = await this.ctx.get_choice(options)
                    await this.run_application(this.ctx, choice)
                }
                break;
                
            case "list":
            case "ls":
                for (const file of this.ctx.glob.scanSync(aim_dir)) {
                    console.log(file)
                }
                break;
                
            default:
                console.log("Unknown command")
                break;
        }
    }
}
