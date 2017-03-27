const BaseNetwork = require('../base/BaseNetwork.js');
const BaseSynapse = require('../base/BaseSynapse.js');
const BaseNeuron = require('../base/BaseNeuron.js');
const { sigmoid, sigmoidPrime } = require('../functions.js').activation;
const Logger = require('../log.js');

class Gene extends BaseSynapse {
	constructor(innovation, parent, child, weight) {
		const n1 =
			parent || new GANeuron(innovation + 'P');
		const n2 =
			child || new GANeuron(innovation + 'C');
		super(n1, n2);
		this.innovation = innovation;
		this.enabled = true;
		this.w = weight ? weight : this.w;
		this.parent.connect(this, this.child);
		this.id = Gene.idFor(this.parent, this.child);
	}

	static idFor(parent, child) {
		return parent.id + child.id;
	}

	setConnection(parent, child) {
		this.parent = parent;
		this.child = child;
		this.parent.connect(this, this.child);
	}

	mutateWeight() {
		// Random weight shift -0.1 to 0.1
		const wShift = Math.random() * 0.2 - 0.1; 	
		this.w += wShift;
		Logger.log(1, 'Mutate weight:', this.w, this.id);
	}

	mutateEnabled() {
		this.enabled = !this.enabled;
		Logger.log(1, 'Mutate enabled:', this.enabled, this.id);
	}	

	mutate() {
		const mutations = [
			this.mutateWeight,
			this.mutateEnabled
		];
		const mutationIndex = Math.floor(Math.random() * mutations.length);
		mutations[mutationIndex].call(this);
	}

	impulse(value) {
		this.enabled && super.impulse(value);
	}

	clone() {
		return new Gene(this.innovation, this.parent.clone(), this.child.clone(), this.w);
	}
}

class GANeuron extends BaseNeuron {
	constructor(id) {
		super(null, sigmoid, sigmoidPrime, null, null, id);
	}

	connect(syn, neuron) {
		this.synapses.push(syn);
		neuron._connectParent(syn);
	}

	reconnect(syn, newChild) {
		const synIndex = this.synapses.indexOf(syn);
		newChild._connectParent(syn);
		this.synapses[synIndex] = syn;
		syn.child._disconnectParent(syn);
	}

	disconnect(syn) {
		const synIndex = this.synapses.indexOf(syn);
		this.synapses.splice(synIndex, 1);
		syn.child._disconnectParent(syn);
	}

	_disconnectParent(parentSyn) {
		const synIndex = this.parentSynapses.indexOf(parentSyn);
		this.parentSynapses.splice(synIndex, 1);
	}

	// Remove all Synapses
	clean() {
		this.parentSynapses = [];
		this.synapses = [];
		return this;
	}

	clone() {
		return new GANeuron(this.id);
	}
}

// NEAT Algorithm (Neuro Evolution of Augmenting Topologies)
class NeatNetwork extends BaseNetwork {
	constructor(options={}, id='N0', _genes) {
		super();
		const numInputs = options.inputs || 1;
		const numOutputs = options.outputs || 1;
		this.genes = _genes || this._constructGenes(numInputs, numOutputs);
		this.inputNeurons = this.getInputNeurons();
		this.network = this._constructNetwork();
		this.mutationRate = options.mutationRate || 0.01;
		this.species = options.species;
		this.fitnessFn = options.fitnessFn || Math.random;
		this.fitnessGenerator = options.fitnessGenerator;
		this.fitness = 0;
		this.id = id;
		Logger.log(1, this.id)
		this.networkAction((n, layer, index) => Logger.log(1, '\t', n.id, layer, index, n.synapses.map(s => s.id).join(', ')));
		Logger.log(1, '\tGenes:')
		this.genes.forEach(g => Logger.log(1, '\t', g.id, g.innovation))
	}

	static fromGenes(genes, options={}, id) {
		return new NeatNetwork(options, id, genes);
	}

	static geneLayerMap(genes) {
		const inputNeurons = genes
			.filter(g => !g.parent.parentSynapses.length)
			.map(g => g.parent);
		return NeatNetwork.constructNetwork(inputNeurons);
	}

	getInputNeurons() {
		return this.genes
			.filter(g => !g.parent.parentSynapses.length)
			.map(g => g.parent);
	}

	get shouldMutate() {
		return Math.random() < this.mutationRate;
	}


	replicateGenes() {
		const newGenes = this.genes.map(g => {
			const newG = g.clone();
			if(this.shouldMutate)
				newG.mutate();	
			return newG;
		});

		return newGenes;
	}

	getContinuousFitness() {
		const iterator = this.fitnessGenerator();
		for(let inputs of iterator) {
			const outputs = this.sendInput(inputs.slice(0, this.inputNeurons.length));
			this.fitness = iterator.next(outputs).value;
		}
		return this.fitness;
	}

	_constructNetwork() {
		return NeatNetwork.constructNetwork(this.inputNeurons);
	}

	_constructGenes(inputs, outputs) {
		const genes = [];
		for(let i = 0; i < outputs; i++) {
			for(let j = 0; j < inputs; j++) {
				const child = genes[0] ? genes[0].child : null;
				genes.push(new Gene(j + (i * j), null, child));
			}
		}
		return genes;
	}

	static constructNetwork(inputNeurons) {
		const neuronLayerMap = {};
		const network = [];
		const traverseNetwork = (neuron, layerIndex=0) => {
			var layer = Math.max(
				neuronLayerMap[neuron.id] ? neuronLayerMap[neuron.id].layer : 0,
				layerIndex
			);
			neuronLayerMap[neuron.id] = { neuron, layer };
			neuron.synapses.forEach(syn =>
				traverseNetwork(syn.child, layerIndex + 1));

		};
		inputNeurons.forEach(n => traverseNetwork(n));
		Object.keys(neuronLayerMap).forEach(key => {
			const nLayerMap = neuronLayerMap[key]
			const layer = network[nLayerMap.layer];
			network[nLayerMap.layer] =  layer ?
				[...layer, nLayerMap.neuron] : [nLayerMap.neuron];
		});
		return network;
	}
}

module.exports = { NeatNetwork, Gene, GANeuron };
