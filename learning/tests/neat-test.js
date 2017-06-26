const NeatManager = require('../neuroevolution/NeatManager.js');
const { NeatNetwork, Gene, GANeuron } = require('../neuroevolution/NeatNetwork.js');
const fn = require('../functions.js');
const Logger = require('../log.js');
const { expect } = require('chai');
describe = () => {};

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
		expect(genes.length).to.equal(originalGeneCount + 1);
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


describe('Network', () => {
	it('Should do xor', () => {
		const genes = makeXORGenes();
		const net = NeatNetwork.fromGenes(genes);
		console.log(net.inputNeurons.map(g=>g.id))
		console.log(net.outputNeurons.map(g=>g.id))
		net.logNetwork(null)
	});
});

const makeXORGenes = (randomize=false) => {
	// Layer 1
	const l000 = new Gene({
		innovation: 'l000',
		isInput: true,
		isOutput: false,
		weight: randomize ? false : 4.144149740115616,
	});
	const l001 = new Gene({
		innovation: 'l001',
		isOutput: false,
		parent: l000.parent,
		weight: randomize ? false : -5.525492054527072
	});
	const l002 = new Gene({
		innovation: 'l002',
		parent: l000.parent,
		weight: randomize ? false : -6.058204454338836
	});

	const l010 = new Gene({
		weight: randomize ? false : -5.8389598903874145,
		innovation: 'l010',
		isInput: true,
		child: l000.child
	});
	const l011 = new Gene({
		weight: randomize ? false : -5.404231019783034,
		innovation: 'l011',
		parent: l010.parent,
		child: l001.child
	});
	const l012 = new Gene({
		innovation: 'l012',
		parent: l010.parent,
		child: l002.child,
		weight: randomize ? false : 4.636770080147614
	});

	const l020 = new Gene({
		weight: randomize ? false : -1.5565624734097243,
		innovation: 'l020',
		isBias: true,
		child: l000.child
	});
	const l021 = new Gene({
		weight: randomize ? false : 1.988408080661879,
		innovation: 'l021',
		parent: l020.parent,
		child: l001.child
	});
	const l022 = new Gene({
		weight: randomize ? false : -1.8952576095256417,
		innovation: 'l022',
		parent: l020.parent,
		child: l002.child
	});

	//Layer 2
	const l100 = new Gene({
		innovation: 'l100',
		weight: randomize ? false : 7.974674880478436,
		isOutput: true,
		parent: l000.child,
	});

	const l110 = new Gene({
		innovation: 'l110',
		weight: randomize ? false : 7.974674880478436,
		parent: l100.child,
		child: l001.child,
	});

	return [l000,l001,l002,l010,l011,l020,l021,l022,l012,l100];
};

module.exports = { makeXORGenes };