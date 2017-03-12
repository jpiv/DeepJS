const BaseSynapse = require('../base/BaseSynapse');
const { log } = require('../log.js');
class BackpropSynapse extends BaseSynapse {
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

module.exports = BackpropSynapse;
