export class Action {
    constructor(ctx) {
        this.ctx = ctx;
        this.help = {
            "title": "scriptchi",
            "text": "",
            "commands": [],
            "parameters": [],
            "author": "",
            "version": "0.1"
        }
    }
    
    async on_execute() {
        let running = true;
        let data = await this.ctx.load_data(this.help.title);

        setInterval(async function(){
            //console.log(data["character"]["energy"]);
        }, 1000)
        
        process.on("SIGINT", async () => {
            running = false;
            console.log("Exiting forced.")
            process.exit()
        });
        
        async function cleanup() {
            console.log("Save data to file...");
            
            process.exit()
        }
        async function getUserInput(){
            while(running) {
                try {
                    const prompt = "(> ";
                    process.stdout.write(prompt);
                    for await (const line of console) {
                        //let u = line.strip()
                        console.log(`?: ${line}`);
                        
                        if(line == ".q") {console.log("Goodbye.");await cleanup();}
                        process.stdout.write(prompt);
                    }
                    
                } catch (e) {
                    console.error(`Exited. ${e.name} ${e.message}`);
                    process.exit()
                }
            }
            console.log("Ended")
        }
        await getUserInput()

    }
}
