const BaseNetwork = require('../base/BaseNetwork.js');
const BackpropNeuron = require('./BackpropNeuron.js');
const { linear } = require('../functions.js').activation;
const Logger = require('../log.js');
class BackpropNetwork extends BaseNetwork {
	constructor(layers, activationFn, activationFnDerivative, lossFn, lossP, activateOutput=true, bias=true) {
		super();
		this.bias = bias;
		this.activationFn = activationFn;
		this.activationFnDerivative = activationFnDerivative;
		this._loss = lossFn;
		this._lossP = lossP;
		this.Neuron = BackpropNeuron;
		this.activateOutput = activateOutput;
		this._layers = layers;
		this.network = this._constructNetwork(layers);
	}

	train(trainingData, learnRate, momentum) {
		const backpropGen =
			this._backpropagate(trainingData, learnRate, momentum);
		for(let b of backpropGen) { continue; }
	}

	setupNeuronGroups() {
		this.inputNeurons = this.bias ? this.network[0].slice(0, -1)
			: this.nework[0];
		this.outputNeurons = this.network[this.network.length - 1];
		this.biasNeurons = this.bias ? this.network.slice(0, -1).map(layer => layer[layer.length - 1]) : [];
	}

	set logLevel(level) {
		Logger.LOG_LEVEL = Number(level);
	}

	set layers(layers) {
		this._layers = layers;
		this.network = this._constructNetwork(layers);
		this.setupNeuronGroups();
	}

	reconstruct() {
		this.reset();
		this.network = this._constructNetwork(this._layers)
		this.setupNeuronGroups();
	}

	_constructNetwork(layers) {
		const network = layers.map((l, i) => {
			const activation = (i === 0 || (i === layers.length - 1 && !this.activateOutput))
				? linear : this.activationFn;
			const group = Array.from(Array(l).keys(), (j) => new this.Neuron(
					activation, this.activationFnDerivative,
					this._loss, this._lossP, this._id(i, j)));
			this.bias && i !== layers.length - 1 && group.push(new this.Neuron(
					this.activationFn, this.activationFnDerivative,
					this._loss, this._lossP, this._id(i, group.length)));
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