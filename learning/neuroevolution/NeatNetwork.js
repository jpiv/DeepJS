const BaseNetwork = require('../base/BaseNetwork.js');
const BaseSynapse = require('../base/BaseSynapse.js');
const BaseNeuron = require('../base/BaseNeuron.js');
const { sigmoid, sigmoidPrime } = require('../functions.js').activation;
const Logger = require('../log.js');

class Gene extends BaseSynapse {
	constructor(invocation, parent, child, weight) {
		const n1 =
			parent || new GANeuron(invocation + 'P');
		const n2 =
			child || new GANeuron(invocation + 'C');
		super(n1, n2);
		this.invocation = invocation;
		this.enabled = true;
		this.w = weight ? weight : this.w;
		this.parent.connect(this, this.child);

	}

	mutateWeight() {
		// Random weight shift -0.1 to 0.1
		const wShift = Math.random() * 0.2 - 0.1; 	
		this.w += wShift;
	}

	mutateEnabled() {
		this.enabled = !this.enabled;
	}	

	mutate() {
		const mutations = [
			this.mutateWeight,
			this.mutateEnabled
		];
		const mutationIndex = Math.floor(Math.random() * mutaions.length);
		mutaions[mutationIndex].call(this);
	}

	replaceChild(newChild)  {
		this.child.disconnectParent(this);
		this.child = newChild;	
		this.parent.reconnect(this, newChild);
		this.id = this.parent.id + this.child.id;
	}

	split(invocation) {
		const newNode = new GANeuron(invocation + 'P');
		const newGene = new Gene(invocation, newNode, this.child, this.w);
		this.replaceChild(newNode);
		return newGene;
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
}

// NEAT Algorithm (Neuro Evolution of Augmenting Topologies)
class NeatNetwork extends BaseNetwork {
	constructor(numInputs, numOutputs) {
		super();
		this.genes = this._constructGenes(numInputs, numOutputs);
		this.inputNeurons = this.genes.slice(0, numInputs).map(n => n.parent);
		this.genes.push(this.genes[0].split(this.genes.length));
		this.network = this._constructNetwork();
		this.mutationRate = 0.01;
		this.networkAction((n, layer, index) => console.log(n.id, layer, index, n.synapses.map(s=>s.id)));
	}

	get shouldMutate() {
		return Math.random() < this.mutationRate;
	}

	applyMutation() {
		
	}

	mate() {
		if(this.shouldMutate) {
			this.applyMutation()
		}
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
				genes.push(new Gene(j + (i * j), null, child));
			}
		}
		return genes;
	}
}

module.exports = NeatNetwork;
