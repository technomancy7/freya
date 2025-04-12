import { $ } from "bun";
//import { HTMLRewriter } from "bun";

export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "",
            "text": "",
            "commands": ["run <app>", "get <app>", "ls"],
            "parameters": [],
            "author": "",
            "version": "0.1"
        }
    }
    
    async extractFileLinks(url, extension) {
        const links = new Set();

        // Fetch the webpage content
        const response = await fetch(url);

        // Use HTMLRewriter to process the HTML and extract links
        const rewriter = new HTMLRewriter().on("a[href]", {
            element(el) {
            const href = el.getAttribute("href");
            if (href && href.endsWith(extension)) {
                try {
                    // Convert relative URLs to absolute URLs
                    const absoluteURL = new URL(href, url).href;
                    links.add(absoluteURL);
                } catch {
                    links.add(href); // Add as-is if conversion fails
                }
            }
            },
        });

        // Process the response
        await rewriter.transform(response).blob();

        return [...links];
    }
    
    async run_application(ctx, path) {
        ctx.writeln("[yellow] Starting application: "+path)
        if(data.cwd) $.cwd(data.cwd);
        if(data.args) params = params.concat(data.args)
        const { stdout, stderr, exitCode } =  await $`${path} ${params}`.nothrow();
        
        ctx.writeln("[yellow]Application ended.[reset]")
        if (exitCode !== 0) {
            ctx.writeln(`[red]Ended with exit code[reset]: ${exitCode}`);
        }

        if(stdout.toString()) ctx.writeln(stdout.toString());
        if(stderr.toString()) ctx.writeln(stderr.toString());
    }
                
    async download_application(path) {
        const cfg = await this.ctx.load_data("appman", "appman")
        this.ctx.writeln(`Downloading: ${path}`)

        //let filename = path.slice(-1)[0] 
        let output, filename = await this.ctx.download_file(path, cfg.paths.downloads)
        console.log(output, filename)
        
        let assume_ft = "";
        if(filename.includes(".")) {
            assume_ft = filename.split(".").slice(-1)
        }
        
        this.ctx.writeln(`Assuming filetype... [${assume_ft}]`);
        this.ctx.writeln(`Launcher: ${cfg.executables[assume_ft]}`)

        if(assume_ft && cfg.executables[assume_ft]) {
            let cmd = cfg.executables[assume_ft].replace("%FILE%", cfg.paths.downloads+filename)
            for await (let line of $`${{raw: cmd}}`.lines()) {
                console.log(line);
            }
            console.log("Deleting file.")
            await $`rm ${cfg.paths.downloads+filename}`
        } else {
            console.log("Unable to determine installer, select an option:")
            let choice = await this.ctx.get_choice(Object.keys(cfg.executables))
            choice = choice.replace("%FILE%", cfg.paths.downloads+filename)
            for await (let line of $`${{raw: choice}}`.lines()) {
                console.log(line);
            }
            console.log("Deleting file.")
            await $`rm ${cfg.paths.downloads+filename}`
        }
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        let data = {};
        const appname = this.ctx.line[1];
        
        switch(cmd) {
            case "run":
                let params = process.argv.slice(5).join(" ")
                data = await this.ctx.load_data("appman", appname)
                if(!data) return this.ctx.writeln("Application manifest not found.")

                await this.run_application(this.ctx, data.launcher)
                break;
            
            case "get":
                data = await this.ctx.load_data("appman", appname)

                if(!data) return this.ctx.writeln("Application manifest not found.")
                    
                this.ctx.writeln("Preparing download of "+data.url)
                if(data.protocol == "html") {
                    let file_ext = data.filetype;
                    this.ctx.writeln("Scanning page for files...");
                    const files = await this.extractFileLinks(data.url, "."+file_ext)
                    if(files && files.length > 0) {
                        let choice = await this.ctx.get_choice(files)
                        await this.download_application(choice)
                    }
                } else {
                    await this.download_application(data.url)
                }
                break;
                
            case "list":
            case "ls":
                for (const file of this.ctx.glob.scanSync(this.ctx.data_dir+"appman")) {
                    if(file != "appman.toml") console.log(file.split(".")[0])
                }
                break;
            default:
                console.log("Unknown command")
                break;
        }
    }
}
