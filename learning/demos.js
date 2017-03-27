const Trainer = require('./trainer.js');
const BackpropNetwork = require('./learning.js').BackpropNetwork;
const fn = require('./functions.js');
const debugArg = process.argv.indexOf('-d');
const b = new BackpropNetwork([2, 2, 1], fn.activation.sigmoid, fn.activation.sigmoidPrime, fn.error.defaultLoss, fn.error.defaultLossP, false);
const trainer = new Trainer(null, b);
const setGen = require('./setGenerator.js');
const Logger = require('./log.js');

const updateLogLevel = () => {
	if(debugArg > -1)
		Logger.LOG_LEVEL = process.argv[debugArg + 1];
};
updateLogLevel();
// Trainer.time(() => trainer.learnXOR(50000));
// Trainer.time(() => trainer.learnDivision(650000));


const NeatManager = require('./neuroevolution/NeatManager.js');
const nm = new NeatManager({
	populationSize: 200,
	compatibilityThreshold: .65,
	network: {
		mutationRate: .01,
		complexificationRate: 0.005,
		inputs: 2,
		fitnessGenerator: function* () {
			const fitnessSet = setGen.XOR(4);
			var fitness = 0;
			for(let i in fitnessSet) {
				const outputs = yield fitnessSet[i].inputs;
				fitness =
					(fitness + fn.fitness.xor(fitnessSet[i].inputs, outputs)) / 2;
				yield fitness;
			}
		}
	}
});
nm.populationFitness();

nm.logSpeciesFitness();
console.log('-------')
for(let i = 0; i < 180; i++) {
	console.log('gen:', i + 1);
	nm.advanceGeneration();
	nm.populationFitness();
}
nm.logSpeciesFitness();