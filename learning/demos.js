const Trainer = require('./trainer.js');
const BackpropNetwork = require('./learning.js').BackpropNetwork;
const debugArg = process.argv.indexOf('-d');
if(debugArg > -1)
	BackpropNetwork.logLevel = process.argv[debugArg + 1];

const trainer = new Trainer(BackpropNetwork);
Trainer.time(trainer.learnXOR());