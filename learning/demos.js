const BackpropNetwork = require('./learning.js').BackpropNetwork;
const setGen = require('./setGenerator.js');
const fn = require('./functions.js');
const { log } = require('./log.js');

const debugArg = process.argv.indexOf('-d');
if(debugArg > -1)
	BackpropNetwork.logLevel = process.argv[debugArg + 1];

const time = fn => {
	const t1 = process.hrtime();
	fn();
	const time = process.hrtime(t1);
	const timeS = time[0] + 's';
	const timeMs = Math.floor((time[1] / 1000000)) + 'ms';
	console.log('Time:', timeS, timeMs);
};

const makeNetworks = (n, layers) => {
	return Array.from(Array(n).keys(), () =>
		new BackpropNetwork(layers, fn.activation.sigmoid, fn.activation.sigmoidPrime, fn.error.defaultLoss, fn.error.defaultLossP));
};
const trainNetworks = (nets, set, learnRate, momentum) => {
	nets.forEach((net, i) =>
		net.train(set, learnRate, momentum));
};
const testNetworks = (nets, testSet, displaySet) => {
	BackpropNetwork.logLevel = 0;	
	nets.forEach(n => {
		error = n.test(testSet);
		console.log('Total Error:', error.map(e => (e * 100).toFixed(2) + '%').join(', '));
		for(let item of n.runSet(displaySet)) {
			console.log('\t' +
				'exp:', item.ideal.join(', '),
				'\tin:', item.inputs.join(', '),	
				'\tout:', item.output.map(o => Number(o.toFixed(4))).join(', '),
				'\te:', item.error.map(e => Math.abs((e * 100)).toFixed(2) + '%').join(', ')
			);
		}
	});
};	
const learn = (layers, rate, momentum, trainSize, testSize, dispSize, setFn) => {
	const nets = makeNetworks(1, layers);
	const trainingSet = setFn(trainSize);
	const testSet = setFn(testSize);
	const displaySet = setFn(dispSize);
	trainNetworks(nets, trainingSet, rate, momentum);
	testNetworks(nets, testSet, displaySet);
};
const learnXOR = () => {
	const layers = [2, 4, 1];
	learn(layers, 0.4, 0.2, 100000, 100, 4, setGen.XOR);
};

const learnNOT = () => {
	const layers = [2, 2, 1];
	learn(layers, 0.4, 0.2, 100000, 100, 4, setGen.NOT);
};

const learnAND = () => {
	const layers = [2, 3, 1];
	learn(layers, 0.4, 0.2, 100000, 100, 4, setGen.AND);
};

const learnXOR3 = () => {
	const layers = [3, 15, 1];
	learn(layers, 0.2, 0.2, 210000, 100, 9, setGen.XOR3);
};

const learnMutualXOR = () => {
	const layers = [3, 15, 2];
	learn(layers, 0.2, 0.2, 100000, 100, 9, setGen.mutualXOR);
};

time(learnMutualXOR);
// time(learnXOR3);
// time(learnXOR);
