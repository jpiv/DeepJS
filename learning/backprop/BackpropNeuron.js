const BaseNeuron = require('../base/BaseNeuron.js');
const BackpropSynapse = require('./BackpropSynapse.js');
const { log } = require('../log.js');
class BackpropNeuron extends BaseNeuron {
	constructor() {
		super(BackpropSynapse, ...arguments);
	}

	backpropagateError() {
		log(this.id, 'backprop error', this.error)
		this.parentSynapses.forEach(syn => syn.backpropagateError(this.error));
	}

	gradientDescent(learnRate, momentum) {
		this.synapses.forEach(syn => syn.gradientDescent(learnRate, momentum));
	}
}

module.exports = BackpropNeuron;
