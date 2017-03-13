const { meanAbsoluteError } = require('../functions.js').error;
const Logger = require('../log.js');
class BaseNetwork {
	constructor(NeuronClass, layers, activationFn, activationFnDerivative, lossFn, lossP, bias=true) {
		this.bias = bias;
		this.activationFn = activationFn;
		this.activationFnDerivative = activationFnDerivative;
		this._loss = lossFn;
		this._lossP = lossP;
		this.Neuron = NeuronClass;
		this.network = this._constructNetwork(layers);
		this.inputNeurons = bias ? this.network[0].slice(0, -1)
			: this.nework[0];
		this.outputNeurons = this.network[this.network.length - 1];
		this.biasNeurons = bias ? this.network.slice(0, -1).map(layer => layer[layer.length - 1]) : [];
	}

	set logLevel(level) {
		Logger.LOG_LEVEL = Number(level);
	}

	reset() {
		this.networkAction(n => n.reset());
	}

	sendInput(inputs) {
		this.reset();
		var results = [];
		if(inputs && inputs.length === this.inputNeurons.length) {
			this.networkAction((neuron, layer, index) => {
				if(this.inputNeurons.indexOf(neuron) > -1)
					neuron.inputImpulse(inputs[index], false);
				
				if(this.outputNeurons.indexOf(neuron) > -1)
					results.push(neuron.outputImpulse());
				else
					neuron.outputImpulse();
			});
		} else {
			throw new Error('Invalid number of inputs');
		}
		Logger.log('out', results)
		return results;
	}

	test(testSet) {
		const setRunner = this.runSet(testSet);
		const errorRates = [];
		for(let value of setRunner) {
			errorRates.push(value.error);
		}

		return meanAbsoluteError(errorRates);
	}

	*runSet(set) {
		for(let i in set){
			let item = set[i];
			let { inputs, ideal } = item;
			let output = this.sendInput(item.inputs);	
			let error = output.map((a, i) => a - item.ideal[i]);
			Logger.log(1, '#' + (Number(i) + 1) + '/' + set.length, error.map(e => (e * 100).toFixed(2) + '%'))
			yield { inputs, ideal, output, error };
		}
	}

	networkAction(actionFn, reverse=false) {
		if(reverse)
			for(let i = this.network.length - 1; i >= 0; i--) {
				for(let j = this.network[i].length - 1; j >= 0; j--) {
					actionFn(this.network[i][j], i, j);
				}
			}
		else
			this.network.forEach((layer, i) => layer.forEach((n, j) => actionFn(n, i, j)));
	}

	_constructNetwork(layers) {
		const network = layers.map((l, i) => {
			const group = Array.from(Array(l).keys(), (j) => new this.Neuron(this.activationFn, this.activationFnDerivative, this._loss, this._lossP, this._id(i, j)));
			this.bias && i !== layers.length - 1 && group.push(new this.Neuron(this.activationFn, this.activationFnDerivative, this._loss, this._lossP, this._id(i, group.length)));
			return group;
		});

		network.forEach((group, i) => {
			if(i < network.length - 1) {
				let nextGroup;
				if(i < network.length - 2 && this.bias)
					nextGroup = network[i + 1].slice(0, -1);
				else
					nextGroup = network[i + 1];
				group.forEach(n1 => {
					nextGroup.forEach(n2 => n1.connect(n2));
				});
			}
		});
		return network;
	}

	_id(i, j) {
		return `N${i}${j}`;
	}
}

module.exports = BaseNetwork;
