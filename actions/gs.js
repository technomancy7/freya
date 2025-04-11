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
    
    async get_all_games(r = 1000) {
        const data = await fetch(`https://master.333networks.com/json/all?r=${r}`)
        const js = await data.json()
        let names = [];
        for(const server of js[0]){
            if(!names.includes(server.gamename)) names.push(server.gamename)
        }
        return names;
    }
    
    async get_servers(game_name, r = 100) {
        const data = await fetch(`https://master.333networks.com/json/${game_name}?r=${r}`)
        const js = await data.json()
        return js;
    }
    
    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        switch(cmd) {
            case "i":
            case "g":
                let gl = await this.get_all_games()
                let g = await this.ctx.filter_choice(gl)
                let servers = await this.get_servers(g)
                console.log(servers)
                break;
            
            default:
                console.log("Unknown command")
                break;
        }
    }
}
