const { log } = require('../log.js');
class BaseSynapse {
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
}

module.exports = BaseSynapse;
