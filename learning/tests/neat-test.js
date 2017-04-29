const NeatManager = require('../neuroevolution/NeatManager.js');
const { NeatNetwork, Gene, GANeuron } = require('../neuroevolution/NeatNetwork.js');
const fn = require('../functions.js');
const Logger = require('../log.js');
const { expect } = require('chai');

const make3LayerGenes = () => {
	const a1c1 = new Gene({
		innovation: 1,
		isInput: true,
		isOutput: true
	});
	const a2c1 = new Gene({
		innovation: 2,
		isInput: true,
		isOutput: true,
		child: a1c1.child
	});
	const a2b1 = new Gene({
		innovation: 3,
		isInput: true,
		isOutput: false,
	});
	const b1c1 = new Gene({
		innovation: 4,
		parent: a2b1.child,
		child: a1c1.child
	});
	return [a1c1, a2c1, a2b1, b1c1];
};

const make3LayerBiasGenes = () => {
	const a1c1 = new Gene({
		innovation: 1,
		isInput: true,
		isOutput: true
	});
	const a2c1 = new Gene({
		innovation: 2,
		isInput: true,
		isOutput: true,
		child: a1c1.child
	});
	const a2b1 = new Gene({
		innovation: 3,
		isInput: true,
		isOutput: true,
		parent: a1c1.parent,
	});
	const b1c1 = new Gene({
		innovation: 4,
		isInput: true,
		isOutput: true,
		parent: a2b1.child,
		child: a1c1.child
	});
	const b2c1 = new Gene({
		innovation: 4,
		isInput: false,
		isOutput: true,
		child: a1c1.child
	});
	return [a1c1, a2c1, a2b1, b1c1, b2c1];
};

describe('Creating Networks', () => {
	it('Should create a network without error', () => {
		const net = new NeatNetwork();
	});

	it('Should construct 2 layer network from genes correctly', () => {
		const a1b1 = new Gene({
			innovation: 1,
			isInput: true,
			isOutput: true
		});
		const a2b1 = new Gene({
			innovation: 2,
			isInput: true,
			isOutput: true,
			child: a1b1.child
		});
		const genes = [a1b1, a2b1];
		const net = NeatNetwork.fromGenes(genes);
		expect(net.network.length).to.equal(2);
		expect(net.network[0].length).to.equal(2);
		expect(net.network[1].length).to.equal(1)
	});

	it('Should construct 3 layer network from genes correctly', () => {
		const genes = make3LayerGenes();
		const net = NeatNetwork.fromGenes(genes);
		expect(net.network.length).to.equal(3);
		expect(net.network[1].length).to.equal(3);
		expect(net.network[2].length).to.equal(1)
	});

	it('Should create a network with 1 connection', () => {
		const a = new Gene({ innovation: 1, isInput: true, isOutput: true });
		const genes = [a];
		const net = NeatNetwork.fromGenes(genes);
		expect(net.network.length).to.be.ok;
	});

	it('Should create a network with 3 layers and 1 bias neuron', () => {
		const genes = make3LayerBiasGenes();
		const net = NeatNetwork.fromGenes(genes);
		expect(net.network.length).to.equal(3);
		expect(net.network[0].length).to.equal(1);
		expect(net.network[1].length).to.equal(3);
		expect(net.network[2].length).to.equal(1);
	});
});

describe('Split Gene', () => {
	var nm;
	before(() => {
		nm = new NeatManager({ population: 0 });
	});

	it('Should split genes 5 times without error', () => {
		for(let i = 0; i < 5; i++) {
			const genes = make3LayerGenes();
			nm.splitGene(genes);
			const net = NeatNetwork.fromGenes(genes);
			expect(NeatNetwork.isViable(genes, 3, 1)).to.be.ok;
		}
	});

	it('Split genes should increase total gene count by two', () => {
		var genes = make3LayerGenes();
		const originalGeneCount = genes.length;
		genes = nm.splitGene(genes);
		expect(genes.length).to.equal(originalGeneCount + 2);
	});

	it('Split gene should add 1 layer to default network', () => {
		const net1 = new NeatNetwork();
		var net2 = new NeatNetwork();
		net2.genes = nm.splitGene(net2.genes);
		net2 = NeatNetwork.fromGenes(net2.genes);
		expect(net2.network.length).to.equal(net1.network.length + 1);
	});
});

describe('Create new connection', () => {
	var nm;
	before(() => {
		nm = new NeatManager({ population: 0 });
	});

	it('Should try and create new connection 100 times without error', () => {
		for(let i = 0; i < 100; i++) {
			const genes = make3LayerGenes();
			nm.createNewConnection(genes);
			const net = NeatNetwork.fromGenes(genes);
		}
	});
});
