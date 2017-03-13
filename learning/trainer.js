const BackpropNetwork = require('./backprop/BackpropNetwork.js');
const setGen = require('./setGenerator.js');
const fn = require('./functions.js');
const { log } = require('./log.js');

class Trainer {
	constructor(iterator, net) {
		this.iterator = iterator;
		this.net = net;
		this.logLevel = 0;
	}

	static time(fn) {
		const t1 = process.hrtime();
		fn();
		const time = process.hrtime(t1);
		const timeS = time[0] + 's';
		const timeMs = Math.floor((time[1] / 1000000)) + 'ms';
		console.log('Time:', timeS, timeMs);
	}

	trainNetworks(set, learnRate, momentum) {
		this.net.train(set, learnRate, momentum, this.iterator);
	}

	testNetworks(testSet, displaySet) {
		this.net.logLevel = 0;
		const error = this.net.test(testSet);
		console.log('Total Error:', error.map(e => (e * 100).toFixed(2) + '%').join(', '));
		for(let item of this.net.runSet(displaySet)) {
			console.log('\t' +
				'exp:', item.ideal.join(', '),
				'\tin:', item.inputs.join(', '),	
				'\tout:', item.output.map(o => Number(o.toFixed(4))).join(', '),
				'\te:', item.error.map(e => Math.abs((e * 100)).toFixed(2) + '%').join(', ')
			);
		}
	}

	learn(layers, rate, momentum, trainSize, testSize, dispSize, setFn) {
		this.net = this.net ||
			new BackpropNetwork(layers, fn.activation.sigmoid, fn.activation.sigmoidPrime, fn.error.defaultLoss, fn.error.defaultLossP)
		this.net.logLevel = this.logLevel;
		const trainingSet = setFn(trainSize);
		const testSet = setFn(testSize);
		const displaySet = setFn(dispSize);
		this.trainNetworks(trainingSet, rate, momentum);
		this.testNetworks(testSet, displaySet);
	}

	learnXOR(n) {
		const layers = [2, 4, 1];
		this.learn(layers, 0.4, 0.2, n, 100, 4, setGen.XOR);
	}

	learnNOT() {
		const layers = [2, 2, 1];
		this.learn(layers, 0.4, 0.2, 100000, 100, 4, setGen.NOT);
	}

	learnAND() {
		const layers = [2, 3, 1];
		this.learn(layers, 0.4, 0.2, 100000, 100, 4, setGen.AND);
	}

	learnXOR3() {
		const layers = [3, 15, 1];
		this.learn(layers, 0.2, 0.2, 210000, 100, 9, setGen.XOR3);
	}

	learnMutualXOR() {
		const layers = [3, 15, 2];
		this.learn(layers, 0.2, 0.2, 100000, 100, 9, setGen.mutualXOR);
	}
};

module.exports = Trainer;
