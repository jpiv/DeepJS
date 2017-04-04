const BaseNetwork = require('../base/BaseNetwork.js');
const BaseSynapse = require('../base/BaseSynapse.js');
const BaseNeuron = require('../base/BaseNeuron.js');
const { sigmoid, sigmoidPrime } = require('../functions.js').activation;
const Logger = require('../log.js');

class Gene extends BaseSynapse {
	constructor(options={}) {
		const n1 =
			options.parent || new GANeuron(options.innovation + 'P', options.isInput);
		const n2 =
			options.child || new GANeuron(options.innovation + 'C', false, options.isOutput);
		super(n1, n2);
		this.innovation = options.innovation;
		this.isInput = this.parent.isInput;
		this.isOutput = this.child.isOutput;
		this.enabled = true;
		this.w = options.weight ? options.weight : this.w;
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
		// Random weight shift -5 to 5
		const wShift = Math.random() * .2 - .1; 	
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
		return new Gene({
			innovation: this.innovation,
			parent: this.parent.clone(),
			child: this.child.clone(),
			weight: this.weight,
			isInput: this.isInput,
			isOutput: this.isOutput
		});
	}
}

class GANeuron extends BaseNeuron {
	constructor(id, isInput, isOutput) {
		super(null, sigmoid, sigmoidPrime, null, null, id);
		this.isInput = isInput || false;
		this.isOutput = isOutput || false;
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
		return new GANeuron(this.id, this.isInput, this.isOutput);
	}
}

// NEAT Algorithm (Neuro Evolution of Augmenting Topologies)
class NeatNetwork extends BaseNetwork {
	constructor(options={}, id='N0', _genes) {
		super();
		this.numInputs = options.inputs || 2;
		this.numOutputs = options.outputs || 1;
		this.genes = _genes || this._constructGenes(this.numInputs, this.numOutputs);
		this.setupNeuronGroups();
		this.network = this._constructNetwork();
		this.mutationRate = options.mutationRate || 0.01;
		this.species = options.species;
		this.fitnessFn = options.fitnessFn || Math.random;
		this.fitnessGenerator = options.fitnessGenerator;
		this.fitness = 0;
		this.id = id;
	}

	logNetwork(level=1) {
		Logger.log(level, this.id)
		this.networkAction((n, layer, index) => Logger.log(level, '\t', n.id, layer, index, n.synapses.map(s => s.id).join(', ')));
		Logger.log(level, '\tGenes:')
		this.genes.forEach(g => Logger.log(level, '\t', g.id, g.innovation))
	}

	static fromGenes(genes, options={}, id) {
		return new NeatNetwork(options, id, genes);
	}

	// Consolidate neurons by id in Genome
	static normalizeGenome(genome) {
		const neuronHash = {};
		// Remove all synapses for all neurons and
			// consolitdate neurons by id
		const filteredGenome = genome.filter(gene => {
			if(gene) {
				neuronHash[gene.parent.id] = gene.parent.clean();
				neuronHash[gene.child.id] = gene.child.clean();
			}
			return !!gene;
		});
		// recreate all connections on new neurons 
		filteredGenome.forEach(gene =>
			gene.setConnection(neuronHash[gene.parent.id], neuronHash[gene.child.id]));
		return filteredGenome.filter(gene => !!gene && (gene.child.synapses.length
				|| gene.isOutput));
	}

	static geneLayerMap(genes) {
		const neuronGroups = NeatNetwork.getNeuronGroups(genes);
		return NeatNetwork.constructNetwork(neuronGroups.outputNeurons);
	}

	static isViable(genes, numInputs, numOutputs) {
		const neuronGroups = NeatNetwork.getNeuronGroups(genes);
		return numInputs === neuronGroups.inputNeurons.length
			&& numOutputs <= neuronGroups.outputNeurons.length;
	}

	static getNeuronGroups(genes) {
		const inputNeurons = {};
		const outputNeurons = {};
		genes.forEach(g => {
			if(g.isInput)
				inputNeurons[g.parent.id] = g.parent;
			if(g.isOutput)
				outputNeurons[g.child.id] = g.child;
		});
		return {
			inputNeurons: Object.keys(inputNeurons).map(id => inputNeurons[id]),
			outputNeurons: Object.keys(outputNeurons).map(id => outputNeurons[id])
		};
	}

	setupNeuronGroups() {
		const neuronGroups = NeatNetwork.getNeuronGroups(this.genes);
		this.inputNeurons = neuronGroups.inputNeurons;
		this.outputNeurons = neuronGroups.outputNeurons;
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
		return NeatNetwork.constructNetwork(this.outputNeurons);
	}

	_constructGenes(inputs, outputs) {
		const genes = [];
		for(let i = 0; i < outputs; i++) {
			for(let j = 0; j < inputs; j++) {
				const child = genes[0] ? genes[0].child : null;
				genes.push(new Gene({
					innovation:j + (i * j),
					isInput: true,
					isOutput: true,
					child
				}));
			}
		}
		return genes;
	}

	static constructNetwork(outputNeurons) {
		const neuronLayerMap = {};
		const network = [];
		var numLayers = 0;
		// HANDLE BIAS NEURONS
		const traverseNetwork = (neuron, action, layerIndex=0, reverse=false) => {
			action(neuron, layerIndex);
			neuron.parentSynapses.forEach(syn =>
				traverseNetwork(syn.parent, action, reverse ? layerIndex - 1 : layerIndex + 1, reverse));
		};
		const depthAction = (n, layerIndex) => {
			numLayers = Math.max(numLayers, layerIndex);
		};
		const action = (neuron, layerIndex) => {
			const layer = neuron.isInput ? 0
				: Math.min(
					neuronLayerMap[neuron.id] ? neuronLayerMap[neuron.id].layer : layerIndex,
					layerIndex
				);
			neuronLayerMap[neuron.id] = { neuron, layer };
		};
		outputNeurons.forEach(n => traverseNetwork(n, depthAction));
		outputNeurons.forEach(n => traverseNetwork(n, action, numLayers, true))
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
