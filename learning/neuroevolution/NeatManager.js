const { NeatNetwork, Gene, GANeuron } = require('./NeatNetwork.js');
const rng = require('random-word');

class NeatManager {
	constructor(options={}) {
		this.networkOptions = options.network;
		this.allGenes = [];
		this.populationSize = options.populationSize || 0;
		this.population = this._initialPopulation();
		this.compatibilityThreshold = options.compatibilityThreshold || 0.1;
		this.species = this.speciate();
	}

	get shouldComplexify() {
		return Math.random() < this.networkOptions.mutationRate;
	}

	_initialPopulation() {
		const net0 = new NeatNetwork(this.networkOptions, 'NT0');
		const population = [net0];
		this.allGenes = net0.genes.map(g => g.id);
		for(let i = 1; i < this.populationSize; i++) {
			let baseGenes = net0.replicateGenes();
			// Complexification
			if(this.shouldComplexify)
				baseGenes = this.splitGene(baseGenes);
			if(this.shouldComplexify)
				baseGenes = this.createNewConnection(baseGenes);
			population.push(NeatNetwork.fromGenes(
				baseGenes,
				this.networkOptions,
				`NT${i}`
			));
	
		}
		return population;
	}

	speciate() {
		const species = [];
		// Excess gene weight
		const excessW = 1;
		// Disjoint gene weight
		const disjointW = 1;
		// Average gene weight difference weight
		const diffW = 1;
		this.population.forEach(individual => {
			let assignedSpecies;
			species.forEach(spec => {
				// Choose random individual from species
				const refIndividual = 
					spec.population[Math.floor(Math.random() * spec.population.length)];
				// Individual with less genes
				// TODO: handle equal genes
				const lowerIndividual = individual.genes.length < refIndividual.genes.length
					? individual : refIndividual;
				let excessGenes =
					Math.abs(individual.genes.length - refIndividual.genes.length);
				// Get number of disjoint genes
				const disjointGenes = lowerIndividual.genes.reduce((acc, g, i) => {
					const hasGene = !!refIndividual.genes.find(g2 =>
						g2.innovation === g.innovation);
					return hasGene ? acc : acc + 1;
				}, 0);
				console.log(excessGenes, disjointGenes, 'ex di');
				// Calulate species distance
				// const speciationNumber =
				// 	(excessW * excessGenes) +
				// 	(disjointW * disjointGenes) +
				// 	(diffW * meanWeightDelta)
			});

			if(assignedSpecies)
				species[assignedSpecies].population.push(individual)
			else {
				species.push({
					name: rng(),
					population: [individual]
				});
			}
		});
	}

	innovation(geneId) {
		return this.allGenes.indexOf(geneId) > -1
			? this.allGenes.indexOf(geneId) : this.allGenes.push(geneId) - 1;
	}

	splitGene(genes) {
		// Split random gene

		const gIndex = Math.floor(Math.random() * genes.length);
		const splitGene = genes[gIndex];

		const newNode = new GANeuron(splitGene.id + 'S');
		const innovations = [
			this.innovation(Gene.idFor(splitGene.parent, newNode)),
			this.innovation(Gene.idFor(newNode, splitGene.child))
		];
		const newGenes = [
			new Gene(innovations[0], splitGene.parent, newNode, this.w),
			new Gene(innovations[1] , newNode, splitGene.child, this.w)
		];

		console.log('Split', newGenes.map(g => g.id));
		return [...genes.slice(0, gIndex), ...newGenes, ...genes.slice(gIndex + 1)];
	}

	createNewConnection(genes) {
		// Add new gene
		// TODO: handle existing connection better
		const parent = genes[Math.floor(Math.random() * genes.length)].parent;
		const child = genes[Math.floor(Math.random() * genes.length)].child;
		const connectionExists = parent.id === child.id ||
			parent.synapses.map(syn => syn.child.id).indexOf(child.id) > -1;
		console.log('New Connection', parent.id, child.id, connectionExists);
		if(!connectionExists) {
			const geneId = Gene.idFor(parent, child);
			const innovation = this.innovation(geneId);
			return [...genes, new Gene(innovation, parent, child)];
		} else {
			console.log('Connection already exists, not pushed');
			return genes;
		}
	}
}

module.exports = NeatManager;
