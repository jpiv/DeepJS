const { NeatNetwork, Gene, GANeuron } = require('./NeatNetwork.js');
const Logger = require('../log.js');
const rng = require('random-word');

class NeatManager {
	constructor(options={}) {
		this.logLevel = 0;
		this.networkOptions = options.network || {};
		this.networkOptions.inputs = options.inputs || 2;
		this.networkOptions.outputs = options.outputs || 1;
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
		const population = [];
		for(let i = 0; i < this.populationSize; i++) {
			population.push(this.makeNetwork(null, `NT${i}`));
			if(!i)
				this.fullGenome = population[i].genes.map(g => g.id);
		}
		return population;
	}

	*trainer(set) {
	}

	makeNetwork(genes, id) {
		// Complexification
		if(!genes || !genes.length)
			return NeatNetwork.fromGenes(
				null,
				this.networkOptions,
				id
			);
		else if(!NeatNetwork.isViable(
			genes,
			this.networkOptions.inputs,
			this.networkOptions.outputs
		))
			return null;
		else {
			if(this.shouldComplexify)
				genes = this.splitGene(genes);
			else if(this.shouldComplexify)
				genes = this.createNewConnection(genes);
			return NeatNetwork.fromGenes(
				genes,
				this.networkOptions,
				id
			);
		}
	}

	logSpeciesFitness() {
		this.species.forEach(s => {
			Logger.log(0, s.name);
			s.population.sort((s1, s2) => s1.fitness - s2.fitness).forEach(n =>{
				Logger.log(0, '\t', n.id, n.fitness);
			});
		});
		this.species.length
			&& this.species[0].population[this.species[0].population.length - 1].logNetwork(0);
	}

	populationFitness() {
		this.population.forEach(net => {
			const f = net.getContinuousFitness()
			if(!f) {
				Logger.LOG_LEVEL = 1;
				Logger.log('Fitness Failed')
				net.logNetwork();
				Logger.LOG_LEVEL = 0;
			}
		});
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
			Math.floor((fitness / totalFitness) * this.populationSize));
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
				const parentA = getParent();
				// TODO: Remove from set instead of Retry
				// TODO: Only mate with self if species size 1
				var parentB = getParent();
				Logger.log(1, 'Parents:', parentA.id, parentB.id);
				const child = this.reproduce(parentA, parentB, `N${childIndex}`)
					|| this.makeNetwork(null, `N${childIndex}`);
				nextGeneration.push(child);
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

		Logger.log(4, 'Reproducing', networkA.id, networkB.id);
		const splitPoint = Math.floor(Math.random() * matchingSets.lower.length + 1) - 1;
		Logger.log(4, 'Split point:', splitPoint);

		const geneParents = [];
		Logger.log(4, strongerSet === matchingSets.B, 'Stronger is B')
		Logger.log(4, 'fitness:', networkA.fitness, networkB.fitness, matchingSets.A === matchingSets.lower, 'A is lower');
		// Set of genes from both parents
		var offspringGenome = matchingSets.higher.map((gene, i) => {
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
		});

		offspringGenome = NeatNetwork.normalizeGenome(offspringGenome);
		Logger.log(4, geneParents)
		Logger.log(4, matchingSets.A.map(g => g && g.id))
		Logger.log(4, matchingSets.B.map(g => g && g.id))
		Logger.log(4, offspringGenome.map(g => g && g.id))
		const offspring = offspringGenome.length && this.makeNetwork(offspringGenome, id);
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
		// Split random gene
		const gIndex = Math.floor(Math.random() * genes.length);
		const splitGene = genes[gIndex];

		// Disconnect split gene from it's parent and child
		splitGene.parent.disconnect(splitGene);

		// Create new node for new genes to connect to
		const newNode = new GANeuron(splitGene.id + 'S');
		const innovations = [
			this.innovation(Gene.idFor(splitGene.parent, newNode)),
			this.innovation(Gene.idFor(newNode, splitGene.child))
		];
		const newGenes = [
			// Gene from old parent to new middle node
			new Gene({
				innovation: innovations[0],
				parent: splitGene.parent,
				child: newNode,
				weight: this.w,
				isInput: splitGene.parent.isInput,
				isOutput: false
			}),
			// Gene from new middle node to old child
			new Gene({
				innovation: innovations[1],
				parent: newNode,
				child: splitGene.child,
				weight: this.w,
				isInput: false,
				isOutput: splitGene.child.isOutput
			})
		];

		Logger.log(1, 'Split', newGenes.map(g => g.id));
		// Create new genome with new genes in place of the split gene
		return [
			...genes.slice(0, gIndex),
			...newGenes,
			...genes.slice(gIndex + 1)
		];
	}

	createNewConnection(genes) {
		// Add new gene
		// TODO: handle existing connection better
		const geneLayerMap = NeatNetwork.geneLayerMap(genes);
		const parentLayerIndex = Math.floor(Math.random() * (geneLayerMap.length - 1));
		const parentLayer = geneLayerMap[parentLayerIndex];
		var parent;
		try {
			parent = parentLayer[Math.floor(Math.random() * parentLayer.length)];
		} catch(e) {
			console.log(genes, e, geneLayerMap.map(g => g.map(i => i.id)))
		}
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
			return [...genes, new Gene({ innovation, parent, child })];
		} else {
			Logger.log(1, 'Connection already exists, not pushed');
			return genes;
		}
	}
}

module.exports = NeatManager;
