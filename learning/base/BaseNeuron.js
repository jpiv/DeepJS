const { log } = require('../log.js');
class BaseNeuron {
	constructor(SynapseClass, activationFn, activationPrime, lossFn, lossP, id) {
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
		this.Synapse = SynapseClass;
	}

	connect(neuron) {
		const syn = new this.Synapse(this, neuron, this._loss, this._lossP);
		this.synapses.push(syn);
		neuron._connectParent(syn);
	}

	reset() {
		this.sum = 0;
		this.output = 1;
		this.error = 0;
		this._errorSum = 0;
	}

	inputImpulse(value) {
		this.sum += value;
		this.output = this._activation(this.sum);
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

	_connectParent(synapse) {
		this.parentSynapses.push(synapse);
	}
}

module.exports = BaseNeuron;
