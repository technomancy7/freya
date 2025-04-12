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
    
    async uploadToLitterbox(filePath, time = "1h") {
        if(!["1h", "12h", "24h", "72h"].includes(time)) time = "1h";
        
        const url = "https://litterbox.catbox.moe/resources/internals/api.php";
        const formData = new FormData();

        // Add required fields to the FormData
        formData.append("reqtype", "fileupload");
        formData.append("time", time)
        formData.append("fileToUpload", Bun.file(filePath)); // Bun.file reads the file for upload

        // Send POST request to Catbox API
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        // Handle response
        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const result = await response.text();
        return result; // Returns the URL of the uploaded file or error message
    }
    
    async uploadToCatbox(filePath, userHash = null) {
        const url = "https://catbox.moe/user/api.php";
        const formData = new FormData();

        // Add required fields to the FormData
        formData.append("reqtype", "fileupload");
        if (userHash) {
            formData.append("userhash", userHash);
        }
        formData.append("fileToUpload", Bun.file(filePath)); // Bun.file reads the file for upload

        // Send POST request to Catbox API
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        // Handle response
        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const result = await response.text();
        return result; // Returns the URL of the uploaded file or error message
    }

    async on_execute() {
        const cmd = this.ctx.line[0];
        const params = this.ctx.line.slice(1)
        const line = params.join(" ")
        
        switch(cmd) {
            case "upload":
                if(this.ctx.args.t){
                    const output = await this.uploadToLitterbox(line, this.ctx.args.t);
                    this.ctx.writeln(output)
                }else{
                    const output = await this.uploadToCatbox(line)
                    this.ctx.writeln(output)
                }
                break;
            
            default:
                console.log("Unknown command")
                break;
        }
    }
}
