const BaseNetwork = require('../base/BaseNetwork.js');
const BackpropNeuron = require('./BackpropNeuron.js');
class BackpropNetwork extends BaseNetwork {
	constructor() {
		super(BackpropNeuron, ...arguments);
	}

	train(trainingData, learnRate, momentum) {
		this._backpropagate(trainingData, learnRate, momentum);
	}

	_backpropagate(set, learnRate, momentum) {
		const setRunner = this.runSet(set);
		for(let result of setRunner) {
			this.networkAction((neuron, layer, index) => {
				let outputIndex = this.outputNeurons.indexOf(neuron);
				if(outputIndex > -1) {
					neuron.setError(result.error[outputIndex]);
				}
				neuron.backpropagateError();
			}, true);
			this.networkAction(n => n.gradientDescent(learnRate, momentum));
		}
	}
}

module.exports = BackpropNetwork;