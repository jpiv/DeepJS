const BaseNetwork = require('../base/BaseNetwork.js');
const BaseSynapse = require('../base/BaseSynapse.js');
const BaseNeuron = require('../base/BaseNeuron.js');
const { linear, sigmoid, sigmoidPrime } = require('../functions.js').activation;
const Logger = require('../log.js');

class Gene extends BaseSynapse {
	constructor(options={}) {
		const n1 =
			options.parent || new GANeuron(options.innovation + 'P', options.isInput, false, options.isBias);
		const n2 =
			options.child || new GANeuron(options.innovation + 'C', false, options.isOutput);
		super(n1, n2);
		this.innovation = options.innovation;
		this.isInput = this.parent.isInput;
		this.isOutput = this.child.isOutput;
		this.enabled = options.enabled === undefined ? true : options.enabled;
		this.w = options.weight ? options.weight : this.w;
		this.parent.connect(this, this.child);
		this.id = options.id || Gene.idFor(this.parent, this.child);
	}

	static idFor(parent, child) {
		return parent.id + child.id;
	}

	setConnection(parent, child) {
		this.parent = parent;
		this.child = child;
		this.parent.connect(this, this.child);
	}

	mutateRandomizeWeight() {
		const newWeight = Math.random() * 40 - 20;
		this.w = newWeight;
		Logger.log(1, 'Mutate weight:', this.w, this.id);
	}

	mutateShiftWeight() {
		// Random weight shift -.5 to .5 
		const wShift = Math.random() * .5 - .25;
		this.w += wShift;
		Logger.log(1, 'Mutate weight:', this.w, this.id);
	}

	mutateEnabled() {
		this.enabled = !this.enabled;
		Logger.log(1, 'Mutate enabled:', this.enabled, this.id);
	}	

	mutate() {
		const mutations = [
			this.mutateShiftWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			this.mutateRandomizeWeight,
			// this.mutateEnabled,
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
			weight: this.w,
			enabled: this.enabled,
			id: this.id
		});
	}
}

class GANeuron extends BaseNeuron {
	constructor(id, isInput, isOutput, isBias) {
		super(null, (isInput ? linear : sigmoid), sigmoidPrime, null, null, id);
		this.isInput = isInput || false;
		this.isOutput = isOutput || false;
		this.isBias = isBias || false;
	}

	connect(syn, neuron) {
		this.synapses.push(syn);
		neuron._connectParent(syn);
	}

	inputImpulse(value) {
		if(!this.isBias){
			super.inputImpulse(value);
		}
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
		return new GANeuron(this.id, this.isInput, this.isOutput, this.isBias);
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
		this.mutationRate = options.mutationRate || 0.0;
		this.species = options.species;
		this.fitnessFn = options.fitnessFn || Math.random;
		this.fitnessGenerator = options.fitnessGenerator;
		this.fitness = 0;
		this.id = id;
		NeatNetwork.useGeneIds(this.network);
	}

	logNetwork(level=1) {
		Logger.log(level, this.id)
		this.networkAction((n, layer, index) =>
			Logger.log(level, '\t', n.isInput, n.isOutput, '\t', n.id, layer, index, n.synapses.map(s => s.id).join(', ')));
		Logger.log(level, '\tGenes:')
		this.genes.forEach(g => Logger.log(level, '\t', g.enabled, g.id, g.w))
		Logger.log(level, '0, 0');
		Logger.log(level, this.sendInput([0, 0]));
		Logger.log(level, '1, 0');
		Logger.log(level, this.sendInput([1, 0]));
		Logger.log(level, '0, 1');
		Logger.log(level, this.sendInput([0, 1]));
		Logger.log(level, '1, 1');
		Logger.log(level, this.sendInput([1, 1]));
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
		Logger.log(6, 'hash', Object.keys(neuronHash), filteredGenome.map(g => g.id))
		// recreate all connections on new neurons 
		filteredGenome.forEach(gene =>
			gene.setConnection(neuronHash[gene.parent.id], neuronHash[gene.child.id]));
		const newFGenome= filteredGenome.filter(gene => !!gene && (gene.child.synapses.length
			|| gene.isOutput));
		return newFGenome
	}

	static geneLayerMap(genes) {
		const neuronGroups = NeatNetwork.getNeuronGroups(genes);
		const net = 
			NeatNetwork.constructNetwork(neuronGroups.outputNeurons);
		 NeatNetwork.useGeneIds(net);
		 return net;
	}

	static getInputDegrees(genes) {
		const filteredGenes = genes.filter(g => !!g)
		const glMap = NeatNetwork.geneLayerMap(filteredGenes);
		const nGroups = NeatNetwork.getNeuronGroups(filteredGenes);
		const baseNet = new BaseNetwork(glMap);
		const inputDegrees = [];
		nGroups.inputNeurons.forEach(inputN => {
			baseNet.networkAction((n, l, i) => {
				if(n === inputN)
					inputDegrees.push(glMap.length - 1 - l);
			});
		});
		return inputDegrees;
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

	static useGeneIds(network) {
		var inputs = [];
		var outputs = [];
		return new BaseNetwork(network).networkAction((n, layer, index) => {
			n.synapses.forEach(syn => {
				// Parent distance from bottom
				const parentDepth = (network.length - 1 - syn.parent.layer)
				// Parent Index
				const parentIndex = syn.parent.index;
				// Child distance from bottom
				const childDepth = isNaN(network.length - 1 - syn.child.layer)
					? 'N' : (network.length - 1 - syn.child.layer);
				// Child Index
				const childIndex = syn.child.index === undefined ? 'N' : syn.child.index;
				if(syn.isInput && inputs.indexOf(syn.parent) === -1)
					inputs.push(syn.parent)
				if(syn.isOutput && outputs.indexOf(syn.child) === -1)
					outputs.push(syn.child)

				const inputKey = syn.isInput ? 'I' + inputs.length : '';
				const outputKey = syn.isOutput ? 'O' + outputs.length : '';
				const biasKey = syn.parent.isBias ? 'B' : '';
				// Position ID with inverted layering
				syn.id = 'G'
					+ parentDepth
					+ parentIndex
					+ childDepth
					+ childIndex
					+ inputKey
					+ outputKey
				syn.parent.id = 'Ne' + parentDepth + parentIndex
					 + (inputKey);
				syn.child.id = 'Ne' + childDepth
					+ childIndex + (outputKey);
				if(syn.parent.isBias) {
					syn.id = 'G'
						+ parentDepth
						+ childDepth
						+ childIndex
						+ biasKey
					syn.parent.id = 'Ne' + parentDepth + (biasKey);
				}
			});
		});
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
		const mutating = this.shouldMutate;
		const numMutatingGenes = Math.floor(Math.random() * this.genes.length);
		const geneRange = Array.from(new Array(numMutatingGenes), (n, i) => i)
		const genesToMutate = [];
		for(let i = 0; i <= numMutatingGenes; i++) {
			const index = Math.floor(Math.random() * geneRange.length);
			const splicedGene = geneRange.splice(index, 1)[0]
			 splicedGene!== undefined && genesToMutate.push(splicedGene);
		};
		const newGenes = this.genes.map((g, i) => {
			const newG = g.clone();
			if(mutating && genesToMutate.indexOf(i) > -1)
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
					innovation: j + (i * j),
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
			// console.log('traverse', neuron.id, neuron.synapses.map(s => s.id))
			neuron.parentSynapses.forEach(syn =>{
				// console.log(syn.id, syn.parent.id, syn.child.id)
				return traverseNetwork(syn.parent, action, reverse ? layerIndex - 1 : layerIndex + 1, reverse);
			})
			// console.log('revers')
		};
		const depthAction = (n, layerIndex) => {
			numLayers = Math.max(numLayers, layerIndex);
		};
		const action = (neuron, layerIndex) => {
			const layer = Math.min(
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
			nLayerMap.neuron.layer = nLayerMap.layer;
			nLayerMap.neuron.index = network[nLayerMap.layer].length - 1;
		});
		return network;
	}
}

module.exports = { NeatNetwork, Gene, GANeuron };
