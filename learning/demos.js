const Trainer = require('./trainer.js');
const BackpropNetwork = require('./learning.js').BackpropNetwork;
const debugArg = process.argv.indexOf('-d');
const trainer = new Trainer();

if(debugArg > -1)
	trainer.logLevel = process.argv[debugArg + 1];

Trainer.time(() => trainer.learnXOR());