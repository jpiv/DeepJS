var LOG_LEVEL;
class Synapse {
	constructor(parentNeuron, childNeuron, lossFn, lossP) {
		this.w = Math.random() - 0.5;
		this.wDelta = 0;
		this.parent = parentNeuron;
		this.child = childNeuron;
		this.gradient = 0;
		this._loss = lossFn;
		this._lossP = lossP
		this.id = this.parent.id + this.child.id;
		log(this.id, 'weight', this.w);
	}

	impulse(value) {
		this.child.inputImpulse(value * this.w);
	}

	backpropagateError(nodeError) {
		this.gradient = this._lossP(this.child.error, this.child.sum, this.parent.output);
		this.parent.updateError(this.child.error * this.w);
	}

	gradientDescent(learnRate, momentum) {
		log(this.id, 'parentOut', this.parent.output, 'cError', this.child.error)
		this.wDelta = -learnRate * this.gradient + momentum * this.wDelta;
		this.w += this.wDelta;
		log(this.id, 'gradient', this.gradient, 'new weight', this.w);
	}
}

class Neuron {
	constructor(activationFn, activationPrime, lossFn, lossP, id) {
		this.id = id || 'N0';
		this.parentSynapses = [];
		// Output synapses
		this.synapses = [];
		this.sum = 0;
		this.error = 0;
		this.output = 1;
		this._errorSum = 0;
		this._activation = activationFn;
		this._activationP = activationPrime;
		this._loss = lossFn;
		this._lossP = lossP;
	}

	connect(neuron) {
		const syn = new Synapse(this, neuron, this._loss, this._lossP);
		this.synapses.push(syn);
		neuron._connectParent(syn);
	}

	reset() {
		this.sum = 0;
		this.output = 1;
		this.error = 0;
		this._errorSum = 0;
	}

	inputImpulse(value, activate=true) {
		this.sum += value;
		this.output = activate ? this._activation(this.sum) : this.sum;
	}

	// Update sum of synapses
	outputImpulse() {
		log(this.id, 'sum', this.sum, this.output);
		this.synapses.forEach(s => s.impulse(this.output));
		return this.output;
	}

	setError(error) {
		this._errorSum = error;	
		this.error = this._errorSum;
	}

	updateError(error, out) {
		log(this.id, 'update error', error, this.error)
		this._errorSum += error;
		this.error = this._loss(this._errorSum, this.sum)
	}

	backpropagateError() {
		log(this.id, 'backprop error', this.error)
		this.parentSynapses.forEach(syn => syn.backpropagateError(this.error));
	}

	gradientDescent(learnRate, momentum) {
		this.synapses.forEach(syn => syn.gradientDescent(learnRate, momentum));
	}

	_connectParent(synapse) {
		this.parentSynapses.push(synapse);
	}
}

class Network {
	constructor(layers, activationFn, activationFnDerivative, lossFn, lossP, bias=true) {
		this.bias = bias;
		this.activationFn = activationFn;
		this.activationFnDerivative = activationFnDerivative;
		this._loss = lossFn;
		this._lossP = lossP;
		this.network = this._constructNetwork(layers);
		this.inputNeurons = bias ? this.network[0].slice(0, -1)
			: this.nework[0];
		this.outputNeurons = this.network[this.network.length - 1];
		this.biasNeurons = bias ? this.network.slice(0, -1).map(layer => layer[layer.length - 1]) : [];
	}

	static set logLevel(level) {
		LOG_LEVEL = Number(level);
	}

	reset() {
		this._networkAction(n => n.reset());
	}

	sendInput(inputs) {
		this.reset()
		var results = [];
		if(inputs && inputs.length === this.inputNeurons.length) {
			this._networkAction((neuron, layer, index) => {
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
		log('out', results)
		return results;
	}

	test(testSet) {
		const setRunner = this.runSet(testSet);
		const errorRates = [];
		for(let value of setRunner) {
			errorRates.push(value.error);
		}

		return this._meanAbsoluteError(errorRates);
	}

	train(trainingData, learnRate, momentum) {
		this._backpropagate(trainingData, learnRate, momentum);
	}

	*runSet(set) {
		for(let i in set){
			let item = set[i];
			let { inputs, ideal } = item;
			let output = this.sendInput(item.inputs);	
			let error = output.map((a, i) => a - item.ideal[i]);
			log(1, '#' + (Number(i) + 1) + '/' + set.length, error.map(e => (e * 100).toFixed(2) + '%'))
			yield { inputs, ideal, output, error };
		}
	}

	_backpropagate(set, learnRate, momentum) {
		const setRunner = this.runSet(set);
		for(let result of setRunner) {
			this._networkAction((neuron, layer, index) => {
				let outputIndex = this.outputNeurons.indexOf(neuron);
				if(outputIndex > -1) {
					neuron.setError(result.error[outputIndex]);
				}
				neuron.backpropagateError();
			}, true);
			this._networkAction(n => n.gradientDescent(learnRate, momentum));
		}
	}

	_meanAbsoluteError(errorRates) {
		let totalError = errorRates[0].map((rate, i) =>
			errorRates.reduce((acc, err) =>
				acc + Math.abs(err[i]), 0) / errorRates.length);
		return totalError;
	}

	_meanSquaredError(errorRates) {
		let totalError = errorRates[0].map((rate, i) =>
			errorRates.reduce((acc, err) =>
				acc + Math.pow(err[i], 2), 0) / errorRates.length);
		return totalError;
	}

	_networkAction(actionFn, reverse=false) {
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
			const group = Array.from(Array(l).keys(), (j) => new Neuron(this.activationFn, this.activationFnDerivative, this._loss, this._lossP, this._id(i, j)));
			this.bias && i !== layers.length - 1 && group.push(new Neuron(this.activationFn, this.activationFnDerivative, this._loss, this._lossP, this._id(i, group.length)));
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

function log(level, ...args) {
	if(level === LOG_LEVEL) {
		return console.log.apply(console.log, args);
	}
}

module.exports = Network;