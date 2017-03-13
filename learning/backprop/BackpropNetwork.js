const BaseNetwork = require('../base/BaseNetwork.js');
const BackpropNeuron = require('./BackpropNeuron.js');
class BackpropNetwork extends BaseNetwork {
	constructor() {
		super(BackpropNeuron, ...arguments);
	}

	train(trainingData, learnRate, momentum, iterator) {
		this._backpropagate(trainingData, learnRate, momentum, iterator);
	}

	_backpropagate(set, learnRate, momentum, iterator) {
		const setRunner = this.runSet(set);
		var iteration = 0;
		for(let result of setRunner) {
			iterator && iterator(iteration, result, this);
			this.networkAction((neuron, layer, index) => {
				let outputIndex = this.outputNeurons.indexOf(neuron);
				if(outputIndex > -1) {
					neuron.setError(result.error[outputIndex]);
				}
				neuron.backpropagateError();
			}, true);
			this.networkAction(n => n.gradientDescent(learnRate, momentum));
			iteration++;
		}
	}
}

module.exports = BackpropNetwork;