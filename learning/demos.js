const Trainer = require('./trainer.js');
const BackpropNetwork = require('./learning.js').BackpropNetwork;
const fn = require('./functions.js');
const debugArg = process.argv.indexOf('-d');
const b = new BackpropNetwork([2, 2, 1], fn.activation.sigmoid, fn.activation.sigmoidPrime, fn.error.defaultLoss, fn.error.defaultLossP);
const trainer = new Trainer(null, b);

if(debugArg > -1)
	trainer.logLevel = process.argv[debugArg + 1];

// Trainer.time(() => trainer.learnXOR(5000), true);
for( let i of trainer.learnXOR(10000, true)) {}