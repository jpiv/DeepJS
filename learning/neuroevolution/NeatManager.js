const { NeatNetwork, Gene, GANeuron } = require('./NeatNetwork.js');
const rng = require('random-word');

class NeatManager {
	constructor(options={}) {
		this.networkOptions = options.network;
		this.fullGenome = [];
		this.populationSize = options.populationSize || 0;
		this.population = this._initialPopulation();
		this.compatibilityThreshold = options.compatibilityThreshold || 1;
		this.species = this.speciate();
	}

	get shouldComplexify() {
		return Math.random() < this.networkOptions.mutationRate;
	}

	_initialPopulation() {
		const net0 = new NeatNetwork(this.networkOptions, 'NT0');
		const population = [net0];
		this.fullGenome = net0.genes.map(g => g.id);
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

	mate() {
		// Calculate adjusted fitness for each specicies
		// Calculate proportion of total adjusted fitness
		// Reproduce that amount of times
	}

	geneMatchingSet(genes) {
		const matchinSet = this.fullGenome.map((id, i) =>
			genes.find(g => g.innovation === i));
		while(!matchinSet[matchinSet.length - 1])
			matchinSet.pop();
		return matchinSet;
	}

	speciate() {
		const species = [];
		// Excess gene weight
		const excessW = 1;
		// Disjoint gene weight
		const disjointW = 1;
		// Average gene weight difference weight
		const meanWeightW = 1;
		this.population.forEach(individual => {
			let assignedSpecies;
			species.forEach((spec, speciesIndex) => {
				// Choose random individual from species
				const refIndividual = 
					spec.population[Math.floor(Math.random() * spec.population.length)];

				const refMatchingSet = this.geneMatchingSet(refIndividual.genes);
				const individualSet = this.geneMatchingSet(individual.genes)
				// Matching set with less genes
				const higherMatchingSet = refMatchingSet.length >= individualSet.length
					? refMatchingSet : individualSet;
				// Matchin set with more genes
				const lowerMatchingSet = refMatchingSet.length < individualSet.length
					? refMatchingSet : individualSet;

				let excessGenes = higherMatchingSet.length - lowerMatchingSet.length;
				let disjointGenes = 0;
				let meanWeightDelta = 0;
				console.log(higherMatchingSet.map(g => g && g.id))
				console.log(lowerMatchingSet.map(g => g && g.id))
				higherMatchingSet.forEach((id, i) => {
					if(i < lowerMatchingSet.length) {
						if(!(lowerMatchingSet[i] && higherMatchingSet[i]))
							disjointGenes++;
						else
							meanWeightDelta = (meanWeightDelta +
								Math.abs(higherMatchingSet[i].w - lowerMatchingSet[i].w)) / 2;
					}
				});

				console.log(excessGenes, disjointGenes, meanWeightDelta, 'ex di');
				// Number of genes in the larger genome
				const N = higherMatchingSet.length;
				// Calulate species distance
				const speciesDistance =
					(excessW * excessGenes) / N +
					(disjointW * disjointGenes) / N +
					(meanWeightW * meanWeightDelta);
				console.log('SN:', speciesDistance);
				assignedSpecies = speciesDistance <= this.compatibilityThreshold
					? speciesIndex : null;
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
		return species;
	}

	innovation(geneId) {
		return this.fullGenome.indexOf(geneId) > -1
			? this.fullGenome.indexOf(geneId) : this.fullGenome.push(geneId) - 1;
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
