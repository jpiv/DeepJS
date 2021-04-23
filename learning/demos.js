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
const { NeatNetwork, Gene, GANeuron } = require('./neuroevolution/NeatNetwork.js');
const gens = 200;
const nm = new NeatManager({
	populationSize: 500,
	geneCompatibilityThreshold: .4,
	weightCompatibilityThreshold: .75,
	complexificationRate: 0.25,
	maxComplexity: 100,
	excessW: 1,
	disjointW: 1,
	degreeDeltaW: 1,
	meanWeightW: 1,
	network: {
		mutationRate: .6,
		inputs: 2,
		fitnessGenerator: function* () {
			const fitnessSet = setGen.XOR(4);
			// console.log(fitnessSet)
			var fitness = 0;
			for(let i in fitnessSet) {
				const outputs = yield fitnessSet[i].inputs;
				const nextFitness = fn.fitness.xor(fitnessSet[i].inputs, outputs);
				fitness += nextFitness;
				// console.log(nextFitness)
				// fitness = !fitness ? nextFitness
					// : (fitness + nextFitness) / 2;
				yield fitness;
			}
		}
	}
});

nm.populationFitness();

nm.logSpeciesFitness();
console.log('-------')
for(let i = 0; i < gens; i++) {
	const fit = nm.strongestNetwork.fitness
	const fits = nm.species.map(spec => {
		return spec.population.reduce((acc, net) => Math.max(acc, net.fitness), 0)
	}).sort((fit1, fit2) => fit1 - fit2);

	console.log('gen:', i + 1,
		'# species', nm.species.length,
		'pop:', nm.population.length,
		'fitness:', fit, fits[0]
		);
	
	nm.advanceGeneration();
	nm.populationFitness();
}
nm.logSpeciesFitness();
const strongestNet = nm.strongestNetwork;
console.log('spec', strongestNet && strongestNet.species);
const outputs = [
	strongestNet.sendInput([1,1]),
	strongestNet.sendInput([0,1]),
	strongestNet.sendInput([1,0]),
	strongestNet.sendInput([0,0]),
]
console.log(outputs)
Logger.LOG_LEVEL = 1 
strongestNet.logNetwork();
