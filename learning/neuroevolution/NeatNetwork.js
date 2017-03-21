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

	}

	mutateWeight() {
		// Random weight shift -0.1 to 0.1
		const wShift = Math.random() * 0.2 - 0.1; 	
		this.w += wShift;
		console.log('Mutate weight:', this.w);
	}

	mutateEnabled() {
		this.enabled = !this.enabled;
		console.log('Mutate enabled:', this.enabled);
	}	

	mutate() {
		const mutations = [
			this.mutateWeight,
			this.mutateEnabled
		];
		const mutationIndex = Math.floor(Math.random() * mutations.length);
		mutations[mutationIndex].call(this);
	}

	replaceChild(newChild)  {
		this.child.disconnectParent(this);
		this.child = newChild;	
		this.parent.reconnect(this, newChild);
		this.id = this.parent.id + this.child.id;
	}

	split(innovation) {
		const newNode = new GANeuron(innovation + 'P');
		const newGene = new Gene(innovation, newNode, this.child, this.w);
		this.replaceChild(newNode);
		return newGene;
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
	}

	disconnectParent(parentSyn) {
		const synIndex = this.parentSynapses.indexOf(parentSyn);
		this.parentSynapses.splice(synIndex, 1);
	}

	clone() {
		return new GANeuron(this.id);
	}
}

// NEAT Algorithm (Neuro Evolution of Augmenting Topologies)
class NeatNetwork extends BaseNetwork {
	constructor(options={}, innovator, id='N0', _genes) {
		super();
		const numInputs = options.inputs || 1;
		const numOutputs = options.outputs || 1;
		this.innovator = innovator;
		this.genes = _genes || this._constructGenes(numInputs, numOutputs);
		this.inputNeurons = this.genes.slice(0, numInputs).map(n => n.parent);
		this.network = this._constructNetwork();
		this.mutationRate = options.mutationRate || 0.01;
		this.id = id;
		console.log(this.id)
		this.networkAction((n, layer, index) => console.log('\t', n.id, layer, index, n.synapses.map(s => s.id).join(', ')));
	}

	static fromGenes(genes, options={}, innovator, id) {
		return new NeatNetwork(options, innovator, id, genes);
	} 

	get shouldMutate() {
		return Math.random() < this.mutationRate;
	}

	splitGene(genes) {
		// Split random gene
		const gIndex = Math.floor(Math.random() * genes.length);
		genes.push(genes[gIndex].split(this.innovator.next()));
		console.log('Split');
	}

	createNewConnection(genes) {
		// Add new gene
		// TODO: handle existing connection better
		const parent = genes[Math.floor(Math.random() * genes.length)].parent;
		const child = genes[Math.floor(Math.random() * genes.length)].child;
		const connectionExists =
			parent.synapses.map(syn => syn.child).indexOf(child) > -1;
		console.log('New Connection', connectionExists);
		if(!connectionExists)
			genes.push(new Gene(this.innovator.next(), parent, child));
		else
			console.log('Connection already exists, not pushed');
	}

	replicateGenes() {
		const newGenes = this.genes.map(g => {
			const newG = g.clone();
			if(this.shouldMutate)
				newG.mutate();	
			return newG;
		});
		// Complexification
		if(this.shouldMutate)
			this.splitGene(newGenes);
		if(this.shouldMutate)
			this.createNewConnection(newGenes);			
		return newGenes;
	}

	_constructNetwork() {
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
		this.inputNeurons.forEach(n => traverseNetwork(n));
		Object.keys(neuronLayerMap).forEach(key => {
			const nLayerMap = neuronLayerMap[key]
			const layer = network[nLayerMap.layer];
			network[nLayerMap.layer] =  layer ?
				[...layer, nLayerMap.neuron] : [nLayerMap.neuron];
		});
		return network;
	}

	_constructGenes(inputs, outputs) {
		const genes = [];
		for(let i = 0; i < outputs; i++) {
			for(let j = 0; j < inputs; j++) {
				const child = genes[0] ? genes[0].child : null;
				genes.push(new Gene(this.innovator.next(), null, child));
			}
		}
		return genes;
	}
}

module.exports = NeatNetwork;
