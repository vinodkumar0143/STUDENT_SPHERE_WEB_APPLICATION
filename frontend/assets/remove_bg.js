const { Jimp } = require('jimp');

async function processImage() {
    try {
        console.log("Loading image...");
        const image = await Jimp.read('logo.png');
        
        console.log("Processing pixels...");
        // Make very dark pixels transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // if it's very dark / near black
            if (r < 25 && g < 25 && b < 25) {
                // calculate alpha based on how close to black it is to avoid hard edges
                // perfectly black (0,0,0) -> 0 alpha
                // 25 -> 255 alpha
                let maxColor = Math.max(r, g, b);
                let alpha = Math.floor((maxColor / 25) * 255);
                this.bitmap.data[idx + 3] = alpha;
            }
        });

        console.log("Saving image...");
        await image.write('logo_transparent.png');
        console.log("Done!");
    } catch (err) {
        console.error(err);
    }
}

processImage();
