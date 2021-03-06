const { meanAbsoluteError } = require('../functions.js').error;
const Logger = require('../log.js');
class Network {
	constructor(network) {
		if(network)
			this.network = network;
	}

	setupNeuronGroups() {
		this.inputNeurons = network[0];
		this.outputNeurons = network[network.length - 1];
	}

	set network(network) {
		this._network = network;
		this.setupNeuronGroups();
	}

	get network() {
		return this._network;
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
					neuron.inputImpulse(inputs[index]);
				
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

	test(testSet) {
		const setRunner = this.runSet(testSet);
		const errorRates = [];
		for(let value of setRunner) {
			errorRates.push(value.error);
		}

		return meanAbsoluteError(errorRates);
	}
}

module.exports = Network;
