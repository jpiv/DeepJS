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
const gens = 1000;
const nm = new NeatManager({
	populationSize: 60,
	compatibilityThreshold: .67,
	complexificationRate: .005,
	excessW: 1,
	disjointW: 1,
	meanWeightW: 0.05,
	network: {
		mutationRate: .2,
		inputs: 2,
		fitnessGenerator: function* () {
			const fitnessSet = setGen.XOR(4);
			// console.log(fitnessSet)
			var fitness = 0;
			for(let i in fitnessSet) {
				const outputs = yield fitnessSet[i].inputs;
				const nextFitness = fn.fitness.xor(fitnessSet[i].inputs, outputs);
				// fitness += nextFitness;
				// console.log(nextFitness)
				fitness = !fitness ? nextFitness
					: (fitness + nextFitness) / 2;
				yield fitness;
			}
		}
	}
});

nm.populationFitness();

nm.logSpeciesFitness();
console.log('-------')
for(let i = 0; i < gens; i++) {
	console.log('gen:', i + 1, '# species', nm.species.length, 'pop:', nm.population.length);
	nm.advanceGeneration();
	nm.populationFitness();
}
nm.logSpeciesFitness();
const strongestNet = nm.strongestNetwork;
console.log('spec', nm.species[0] && nm.species[0].name);
console.log('0, 0');
console.log(strongestNet.sendInput([0, 0]));
console.log('1, 0');
console.log(strongestNet.sendInput([1, 0]));
console.log('0, 1');
console.log(strongestNet.sendInput([0, 1]));
console.log('1, 1');
console.log(strongestNet.sendInput([1, 1]));