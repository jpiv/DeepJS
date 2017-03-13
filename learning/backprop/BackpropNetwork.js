const BaseNetwork = require('../base/BaseNetwork.js');
const BackpropNeuron = require('./BackpropNeuron.js');
class BackpropNetwork extends BaseNetwork {
	constructor() {
		super(BackpropNeuron, ...arguments);
	}

	train(trainingData, learnRate, momentum) {
		const backpropGen =
			this._backpropagate(trainingData, learnRate, momentum);
		for(let b of backpropGen) { continue; }
	}

	*genTrain(trainingData, learnRate, momentum) {
		yield* this._backpropagate.apply(this, arguments);	
	}

	*_backpropagate(set, learnRate, momentum) {
		const setRunner = this.runSet(set);
		var iteration = 0;
		for(let result of setRunner) {
			yield { iteration, result, network: this };
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