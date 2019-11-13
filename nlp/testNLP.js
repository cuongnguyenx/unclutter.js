var embedlib = require('./embeddings.js');
let asd = embedlib.loadModel('../shared/assets/word-embeddings.json').then(e => {
   console.log("Done!")
});