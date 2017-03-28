const { NeatNetwork, Gene, GANeuron } = require('./NeatNetwork.js');
const Logger = require('../log.js');
const rng = require('random-word');

class NeatManager {
	constructor(options={}) {
		this.logLevel = 0;
		this.networkOptions = options.network;
		this.fullGenome = [];
		this.populationSize = options.populationSize || 0;
		this.population = this._initialPopulation();
		this.compatibilityThreshold = options.compatibilityThreshold || 1;
		this.complexificationRate = options.complexificationRate || .1;
		// Excess gene weight
		this.excessW = options.excessW || 1;
		// Disjoint gene weight
		this.disjointW = options.disjointW || 1;
		// Average gene weight difference weight
		this.meanWeightW = options.meanWeightW || 1;
		this.species = this.speciate();
		Logger.log(1, 'Species:');
		this.species.map(s => Logger.log(1, '\t', s.name, s.population.length));
	}

	get shouldComplexify() {
		return Math.random() < this.complexificationRate;
	}

	_initialPopulation() {
		const net0 = new NeatNetwork(this.networkOptions, 'NT0');
		const population = [net0];
		this.fullGenome = net0.genes.map(g => g.id);
		for(let i = 1; i < this.populationSize; i++) {
			let baseGenes = net0.replicateGenes();
			population.push(this.makeNetwork(baseGenes, `NT${i}`));
		}
		return population;
	}

	*trainer(set) {
	}

	makeNetwork(genes, id) {
		// Complexification
		if(this.shouldComplexify)
			genes = this.splitGene(genes);
		if(this.shouldComplexify)
			genes = this.createNewConnection(genes);
		return NeatNetwork.fromGenes(
			genes,
			this.networkOptions,
			id
		);
	}

	logSpeciesFitness() {
		this.species.forEach(s => {
			Logger.log(0, s.name);
			s.population.sort((s1, s2) => s1.fitness - s2.fitness).forEach(n =>{
				Logger.log(0, '\t', n.id, n.fitness);
			});
		});
		this.species[0].population[this.species[0].population.length - 1].logNetwork(0);
	}
	populationFitness() {
		this.population.forEach(net =>
			net.getContinuousFitness());
	}

	advanceGeneration() {
		const nextGeneration = [];
		const speciesFitnesses = this.species.map(spec =>
			spec.population.reduce((acc, network) =>
				acc + 
					(network.fitness / spec.population.length)
			, 0));
		const totalFitness = speciesFitnesses.reduce((acc, fit) => acc + fit, 0);
		// Proportional amount of reproductions allowed per species
		const speciesOffspringAmounts = speciesFitnesses.map(fitness =>
			Math.round((fitness / totalFitness) * this.populationSize));
		Logger.log(1, 'Species Fitnesses:', speciesFitnesses, 'total:', totalFitness);
		Logger.log(1, 'Offspring', speciesOffspringAmounts);
		// Calculate adjusted fitness for each specicies
		// Calculate proportion of total adjusted fitness
		this.species.forEach((spec, speciesIndex) => {
			var childIndex = 0;
			// Array of species population fitness sorted by fitness
			const popByFitness = spec.population
				.sort((n1, n2) => n1.fitness - n2.fitness);

			const totalSpecFitness = popByFitness.reduce((acc, n, i) =>
				acc + n.fitness * Math.pow(2, i), 0);
			// Array of species pobabilities to reproduce
			const popByProb = popByFitness.map((n, i) =>
				(n.fitness * Math.pow(2, i)) / totalSpecFitness);
			const createSelectionSet = () => {
				var lastProb = popByProb[0];
				return popByProb.map((prob, speciesIndex) => {
					if(popByProb.length === 1)
						return 1;
					if(speciesIndex === 0)
						return prob;
					lastProb = lastProb + prob;
					return lastProb;
				});
			};
			const probSelectionSet = createSelectionSet();
			Logger.log(1, 'Fitness:', popByFitness.map(i => i.fitness))
			Logger.log(1, 'Prob:', popByProb);
			Logger.log(3, 'Prob Selection:', probSelectionSet)
			for(let i = 0; i < speciesOffspringAmounts[speciesIndex]; i++) {
				const getParent = () => {
					const outcome = Math.random();
					return popByFitness
							.reduce((acc, net, i) =>
								acc || (outcome < probSelectionSet[i]
									&& net),
								null
							);
				};
				Logger.log(1, popByFitness.map(n => [n.id, n.fitness]))
				var child;
				var attempt = 0;
				do {
					const parentA = getParent();
					// TODO: Remove from set instead of Retry
					// TODO: Only mate with self if species size 1
					var parentB = getParent();
					Logger.log(1, 'Parents:', parentA.id, parentB.id);
					child = this.reproduce(parentA, parentB, `N${childIndex}`)
					attempt++
				} while(child.getInputNeurons().length !== this.networkOptions.inputs && attempt < this.populationSize)
				nextGeneration.push(child);
				childIndex++;
			}
		});
		this.population = nextGeneration;
		this.species = this.speciate(true);
	}

	reproduce(networkA, networkB, id) {
		// Crossover	
		const genomeA = networkA.replicateGenes();
		const genomeB = networkB.replicateGenes();
		const matchingSets = this.geneMatchingSets(genomeA, genomeB);
		const strongerSet = networkA.fitness !== networkB.fitness
			? (networkA.fitness > networkB.fitness
				? matchingSets.A : matchingSets.B) : null;

		Logger.log(1, 'Reproducing', networkA.id, networkB.id);
		const splitPoint = Math.floor(Math.random() * matchingSets.lower.length + 1) - 1;
		Logger.log(1, 'Split point:', splitPoint);

		const geneParents = [];
		Logger.log(1, strongerSet === matchingSets.B, 'Stronger is B')
		Logger.log(1, 'fitness:', networkA.fitness, networkB.fitness, matchingSets.A === matchingSets.lower, 'A is lower');
		// Set of genes from both parents
		const offspringGenome = matchingSets.higher.map((gene, i) => {
			if(!matchingSets.lower[i] || !gene) {
				if(strongerSet) {
					geneParents.push('stronger');
					return strongerSet[i];
				} else {
					geneParents.push('coin flip')
					const coinFlip = Math.round(Math.random());
					return coinFlip ? matchingSets.lower[i]
						: matchingSets.higher[i];
				}
			} else if(i < splitPoint) {
				geneParents.push('lower')
				return matchingSets.lower[i];
			} else {
				geneParents.push('higher')
				return matchingSets.higher[i];
			}
		}).filter(gene => !!gene);
		// Scrub genes to consolidate neurons 
		const neuronHash = {};
		offspringGenome.forEach(gene => {
			neuronHash[gene.parent.id] = gene.parent.clean();
			neuronHash[gene.child.id] = gene.child.clean();
		});
		offspringGenome.forEach(gene =>
			gene.setConnection(neuronHash[gene.parent.id], neuronHash[gene.child.id]));
		Logger.log(1, geneParents)
		Logger.log(1, matchingSets.A.map(g => g && g.id))
		Logger.log(1, matchingSets.B.map(g => g && g.id))
		Logger.log(1, offspringGenome.map(g => g && g.id))
		const offspring = this.makeNetwork(offspringGenome, id);
		return offspring;
	}

	geneMatchingSets(genesA, genesB) {
		const matchingSetA = this.fullGenome.map((id, i) =>
			genesA.find(g => g.innovation === i));
		while(!matchingSetA[matchingSetA.length - 1])
			matchingSetA.pop();
		const matchingSetB = this.fullGenome.map((id, i) =>
			genesB.find(g => g.innovation === i));
		while(!matchingSetB[matchingSetB.length - 1])
			matchingSetB.pop();
		// Matching set with more or less genes
		let higherMatchingSet = matchingSetB;
		let lowerMatchingSet = matchingSetA;
		let higherKey = 'B';
		if(matchingSetA.length >= matchingSetB.length) {
			const higherMatchingSet = matchingSetA;
			const lowerMatchingSet = matchingSetB;
			const higherKey = 'A';
		}
		return {
			higher: higherMatchingSet,
			lower: lowerMatchingSet,
			A: matchingSetA,
			B: matchingSetB
		};
	}

	speciate(respeciate=false) {
		var lastSpecies = respeciate ? this.species : [];
		const species = lastSpecies.map(s => {
			return { name: s.name, population: [] };
		});
		this.population.forEach(individual => {
			let assignedSpecies;
			species.forEach((spec, speciesIndex) => {
				const lastPopulation = spec.population.length
					? spec.population : lastSpecies[speciesIndex].population;
				// Choose random individual from species
				const refIndividual = 
					lastPopulation[Math.floor(Math.random() * lastPopulation.length)];
				const matchingSets =
					this.geneMatchingSets(refIndividual.genes, individual.genes);

				let excessGenes = 0;
				let disjointGenes = 0;
				let meanWeightDelta = 0;
				Logger.log(1, matchingSets.higher.map(g => g && g.id))
				Logger.log(1, matchingSets.lower.map(g => g && g.id))
				matchingSets.higher.forEach((id, i) => {
					if(i < matchingSets.lower.length) {
						if(!!matchingSets.lower[i] ^ !!matchingSets.higher[i])
							disjointGenes++;
						else if(matchingSets.higher[i])
							meanWeightDelta = (meanWeightDelta +
								Math.abs(matchingSets.higher[i].w - matchingSets.lower[i].w)) / 2;
					} else if(matchingSets.higher[i])
						excessGenes++;
				});

				Logger.log(2, excessGenes, disjointGenes, meanWeightDelta, 'ex di');
				// Number of genes in the larger genome
				const N = matchingSets.higher.length;
				// Calulate species distance
				const speciesDistance =
					(this.excessW * excessGenes) / N +
					(this.disjointW * disjointGenes) / N +
					(this.meanWeightW * meanWeightDelta);
				Logger.log(1, 'SN:', speciesDistance);
				assignedSpecies = speciesDistance <= this.compatibilityThreshold
					? speciesIndex : null;
			});

			if(typeof assignedSpecies === 'number'){
				species[assignedSpecies].population.push(individual)
				individual.species = species[assignedSpecies].name;
			} else {
				species.push({
					name: rng(),
					population: [individual]
				});
				individual.species = species[species.length - 1].name;
			}
		});
		return species.filter(s => s.population.length);
	}

	innovation(geneId) {
		return this.fullGenome.indexOf(geneId) > -1
			? this.fullGenome.indexOf(geneId) : this.fullGenome.push(geneId) - 1;
	}

	splitGene(genes) {
		if(!genes.length)
			return genes;
		// Split random gene
		const gIndex = Math.floor(Math.random() * genes.length);
		const splitGene = genes[gIndex];

		splitGene.parent.disconnect(splitGene);

		const newNode = new GANeuron(splitGene.id + 'S');
		const innovations = [
			this.innovation(Gene.idFor(splitGene.parent, newNode)),
			this.innovation(Gene.idFor(newNode, splitGene.child))
		];
		const newGenes = [
			new Gene(innovations[0], splitGene.parent, newNode, this.w),
			new Gene(innovations[1] , newNode, splitGene.child, this.w)
		];

		Logger.log(1, 'Split', newGenes.map(g => g.id));
		return [...genes.slice(0, gIndex), ...newGenes, ...genes.slice(gIndex + 1)];
	}

	createNewConnection(genes) {
		// Add new gene
		if(!genes.length)
			return genes;
		// TODO: handle existing connection better
		const geneLayerMap = NeatNetwork.geneLayerMap(genes);
		const parentLayerIndex = Math.floor(Math.random() * (geneLayerMap.length - 1));
		const parentLayer = geneLayerMap[parentLayerIndex];
		const parent = parentLayer[Math.floor(Math.random() * parentLayer.length)];
		const childSubMap = geneLayerMap.slice(parentLayerIndex + 1);
		const childLayerIndex = Math.floor(Math.random() * childSubMap.length);
		const childLayer = childSubMap[childLayerIndex];
		const child = childLayer[Math.floor(Math.random() * childLayer.length)];

		const connectionExists = parent.id === child.id ||
			parent.synapses.map(syn => syn.child.id).indexOf(child.id) > -1;
		Logger.log(1, 'New Connection', parent.id, child.id, connectionExists);
		if(!connectionExists) {
			const geneId = Gene.idFor(parent, child);
			const innovation = this.innovation(geneId);
			return [...genes, new Gene(innovation, parent, child)];
		} else {
			Logger.log(1, 'Connection already exists, not pushed');
			return genes;
		}
	}
}

module.exports = NeatManager;
