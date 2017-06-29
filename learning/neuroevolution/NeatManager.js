const { NeatNetwork, Gene, GANeuron } = require('./NeatNetwork.js');
const Logger = require('../log.js');
const rng = require('random-word');
const { makeXORGenes } = require('../tests/neat-test.js');

class NeatManager {
	constructor(options={}) {
		this.logLevel = 0;
		this.networkOptions = options.network || {};
		this.networkOptions.inputs = options.inputs || 2;
		this.networkOptions.outputs = options.outputs || 1;
		this.maxComplexity = options.maxComplexity || 10;
		this.fullGenome = [];
		this.populationSize = options.populationSize || 0;
		this.population = this._initialPopulation();
		this.compatibilityThreshold = options.compatibilityThreshold || 1;
		this.innovationNum = 0;
		this.complexificationRate = options.complexificationRate || 0;
		// Excess gene weight
		this.excessW = options.excessW || 1;
		// Disjoint gene weight
		this.disjointW = options.disjointW || 1;
		// Average gene weight difference weight
		this.meanWeightW = options.meanWeightW || 1;
		// Average input degress difference
		this.degreeDeltaW = options.degreeDeltaW || 1;
		this.species = this.speciate();
		Logger.log(1, 'Species:');
		this.species.map(s => Logger.log(1, '\t', s.name, s.population.length));
	}

	shouldComplexify(size) {
		if(size >= this.maxComplexity)
			return false
		return Math.random() < this.complexificationRate;
	}

	get shouldMutate() {
		return Math.random() < this.networkOptions.mutationRate;
	}

	_initialPopulation() {
		const population = [];
		const base = this.makeNetwork(null, `NT-1`)
		for(let i = 0; i < this.populationSize; i++) {
			const newGenes = base.replicateGenes();
			NeatNetwork.normalizeGenome(newGenes)	
			const genes = NeatNetwork.geneLayerMap(newGenes);
			population.push(this.makeNetwork(newGenes, `NT${i}`));
			if(!i)
				this.fullGenome = population[i].genes.map(g => g.id);
			// const genes = makeXORGenes(true);
			// population.push(this.makeNetwork(genes, `NT${i}`));
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
		)) {
			console.log(genes.map(g => [g.parent.id, g.child.id, g.id]))
			throw Error('NOT VIABLE')
			return null;
		} else {
			if(this.shouldComplexify(genes.length)) {
				const pickOne = Math.floor(Math.random() * 9);

				const options = [
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.createNewConnection(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.addNeuron(genes);
						NeatNetwork.geneLayerMap(genes);
						NeatNetwork.normalizeGenome(genes);
					},
					() => {
						genes = this.splitGene(genes);
						NeatNetwork.geneLayerMap(genes)
					},
					() => {
						genes = this.addBias(genes);
						NeatNetwork.geneLayerMap(genes);
						NeatNetwork.normalizeGenome(genes);
					}
				];

				options[pickOne]();
			}
			return NeatNetwork.fromGenes(
				genes,
				this.networkOptions,
				id
			);
		}
	}

	logSpeciesFitness() {
		this.species.forEach(s => {
			Logger.log(0, s.name, s.population.length);
			s.population.sort((s1, s2) => s1.fitness - s2.fitness).forEach((n,i,l) => {
				if(i === l.length - 1) {
					Logger.log(0, '\t', n.id, n.fitness);
					n.logNetwork(0);
				}
			});
		});
		const strongestNet = this.strongestNetwork;
		strongestNet
			&& strongestNet.logNetwork(0);
		Logger.log(0, strongestNet
			&& strongestNet.fitness);
	}

	get strongestNetwork() {
		const fits = this.species.map(spec => {
			return spec.population.reduce((acc, net) => acc.fitness >= net.fitness ? acc : net, 0)
		}).sort((net1, net2) => net2.fitness - net1.fitness);
		return fits[0]
	}

	populationFitness() {
		this.population.forEach(net => {
			const f = net.getContinuousFitness()
		});
	}

	advanceGeneration() {
		// if(this.species.length > 50) {
		// 	this.compatibilityThreshold = 1.3
		// 	console.log("up ")
		// }
		const nextGeneration = [];
		const speciesFitnesses = this.species.map(spec =>
			spec.population.reduce((acc, network) =>
				acc + 
					(network.fitness / spec.population.length)
			, 0));
		const totalFitness = speciesFitnesses.reduce((acc, fit) => acc + fit, 0);
		// Proportional amount of reproductions allowed per species
		const speciesOffspringAmounts = speciesFitnesses.map(fitness =>
			Math.ceil((fitness / totalFitness) * this.populationSize));
		Logger.log(7, 'Species Fitnesses:', speciesFitnesses, 'total:', totalFitness);
		Logger.log(7, 'Offspring', speciesOffspringAmounts);
		// var adjustedFitnesses = [];	
		// this.species.forEach((spec, i) => {
		// 	const speciesAdjustedFitnesses = spec.population.map(net =>
		// 		({ fitness: net.fitness / spec.population.length, net }));
		// 	adjustedFitnesses = [...adjustedFitnesses, ...speciesAdjustedFitnesses];
		// });
		// adjustedFitnesses
		// 	.sort((fit1, fit2) => fit1.fitness - fit2.fitness)
		// const totalFitness = adjustedFitnesses.reduce((acc, fit) => acc + fit.fitness, 0);
		// const popByProb = adjustedFitnesses.map(fit => fit.fitness / totalFitness);
		// const createSelectionSet = () => {
		// 	var lastProb = popByProb[0];
		// 	return popByProb.map((prob, speciesIndex) => {
		// 		if(popByProb.length === 1)
		// 			return 1;
		// 		if(speciesIndex === 0)
		// 			return prob;
		// 		lastProb = lastProb + prob;
		// 		return lastProb;
		// 	});
		// };
		// const probSelectionSet = createSelectionSet();
		// Logger.log(3, 'adjustedFitnesses', adjustedFitnesses.map(fit => `${fit.fitness} ${fit.net.species}`))
		// Logger.log(3, 'popByProb', popByProb)
		// Logger.log(3, 'probSelectionSet', probSelectionSet)
		// this.population.forEach((individual, childIndex) => {
		//  	const getParent = (excludeN) => {
		// 		const outcome = Math.random();
		// 		var excludeIndex;
		// 		const fitnessSelection = adjustedFitnesses.filter((fit, i) => {
		// 			if(fit.net === excludeN) {
		// 				excludeIndex = i; 
		// 				return false;
		// 			}
		// 			return true;
		// 		});
		// 		const probSelection = probSelectionSet.filter((p, i) =>
		// 			i !== excludeIndex);
		// 		return fitnessSelection
		// 			.reduce((acc, net, i) =>
		// 				acc || (outcome < probSelection[i]
		// 					&& net),
		// 				null
		// 			) || fitnessSelection[fitnessSelection.length - 1];
		// 	};
		// 	const parentA = getParent().net;
		// 	// Logger.log(3, popByFitness.indexOf(parentA))
		// 	// TODO: Only mate with self if species size 1
		// 	var parentB = getParent(parentA).net;
		// 	// console.log(parentA.id, parentB.id)
		// 	// Logger.log(1, 'Parents:', parentA.id, parentB.id);
		// 	if(!parentB || !parentA){
		// 		console.log('No Parent B')
		// 	}
		// 	const child = (parentB && this.reproduce(parentA, parentB, `N${childIndex}`))
		// 		|| this.makeNetwork(null, `N${childIndex}`);
		// 	childIndex++;
		// 	nextGeneration.push(child);
		// });
		// Calculate adjusted fitness for each specicies
		// Calculate proportion of total adjusted fitness
		this.species.forEach((spec, speciesIndex) => {

			var childIndex = 0;
			// Array of species population fitness sorted by fitness
			const popByFitness = spec.population
				.sort((n1, n2) => n1.fitness - n2.fitness);

			const totalSpecFitness = popByFitness.reduce((acc, n, i) =>
				acc + (Math.pow(n.fitness, 2)), 0);
			// Array of species pobabilities to reproduce
			const popByProb = popByFitness.map((n, i) =>
				(Math.pow(n.fitness, 2)) / totalSpecFitness);
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
			Logger.log(3, 'Fitness:', popByFitness.map(i => i.fitness))
			Logger.log(3, 'Prob:', popByProb);
			Logger.log(3, 'Prob Selection:', probSelectionSet)
			if(speciesOffspringAmounts[speciesIndex] < 1)
				console.log('dead species', speciesOffspringAmounts[speciesIndex]);	
			for(let i = 0; i < speciesOffspringAmounts[speciesIndex]; i++) {
				const getParent = (excludeN) => {
					const outcome = Math.random();
					var excludeIndex;
					const fitnessSelection = popByFitness.filter((n, i) => {
						if(n === excludeN) {
							excludeIndex = i; 
							return false;
						}
						return true;
					});
					const probSelection = probSelectionSet.filter((p, i) =>
						i !== excludeIndex);
					return fitnessSelection
						.reduce((acc, net, i) =>
							acc || (outcome < probSelection[i]
								&& net),
							null
						) || fitnessSelection[fitnessSelection.length - 1];
				};
				const parentA = getParent();
				// Logger.log(3, popByFitness.indexOf(parentA))
				// TODO: Only mate with self if species size 1
				var parentB = getParent(spec.population.length > 1 && parentA);
				// console.log(parentA.id, parentB.id)
				// Logger.log(1, 'Parents:', parentA.id, parentB.id);
				if(!parentB){
					console.log(probSelectionSet, spec.population.length)
					console.log('hereeee', speciesOffspringAmounts[speciesIndex])
				}
				const child = (parentB && this.reproduce(parentA, parentB, `N${childIndex}`))
					|| this.makeNetwork(null, `N${childIndex}`);
				childIndex++;
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
		const coinFlip = Math.round(Math.random());
		var offspringGenome = matchingSets.higher.map((gene, i) => {
			if(!matchingSets.lower[i] || !gene) {
				if(strongerSet) {
					geneParents.push('stronger');
					return strongerSet[i];
				} else {
					geneParents.push('coin flip')
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
		Logger.log(4, offspringGenome.map(g => g && g.id))
		Logger.log(4, geneParents)
		Logger.log(4, matchingSets.A.map(g => g && g.id))
		Logger.log(4, matchingSets.B.map(g => g && g.id))
		Logger.log(4, offspringGenome.map(g => g && g.id) + 'fdas')
		offspringGenome = NeatNetwork.normalizeGenome(offspringGenome);
		Logger.log(4, offspringGenome.map(g => g && g.id) + 'fdas')
		// Probs don't need this!
		NeatNetwork.geneLayerMap(offspringGenome)
		Logger.log(4, offspringGenome.map(g => g && g.id) + '32')
		if(!offspringGenome.length)
			console.log('NO GENES')
		return offspringGenome.length && this.makeNetwork(offspringGenome, id);
	}

	geneMatchingSets(genesA, genesB) {
		Logger.log(5, this.fullGenome, genesB.map(g=>g.id), genesA.map(g=>g.id))
		const matchingSetA = this.fullGenome.map((id, i) =>
			genesA.find(g => g.id === id));
		while(matchingSetA.length && !matchingSetA[matchingSetA.length - 1])
			matchingSetA.pop();
		const matchingSetB = this.fullGenome.map((id, i) =>
			genesB.find(g => g.id === id));
		while(matchingSetB.length && !matchingSetB[matchingSetB.length - 1])
			matchingSetB.pop();
		// Matching set with more or less genes
		let higherMatchingSet = matchingSetB;
		let lowerMatchingSet = matchingSetA;
		let higherKey = 'B';
		if(matchingSetA.length >= matchingSetB.length) {
			higherMatchingSet = matchingSetA;
			lowerMatchingSet = matchingSetB;
			higherKey = 'A';
		}
		return {
			higher: higherMatchingSet,
			lower: lowerMatchingSet,
			A: matchingSetA,
			B: matchingSetB,
			higherKey
		};
	}

	makeFullGenome() {
		const genomeHash = {};
		this.population.forEach(net => {
			net.networkAction(n =>
				n.synapses.forEach(syn =>
					genomeHash[syn.id] = 1));
		});
		this.fullGenome = Object.keys(genomeHash);
	}

	speciate(respeciate=false) {
		this.makeFullGenome();
		var lastSpecies = [];
		const species = lastSpecies.map(s => {
			return { name: s.name, population: [] };
		});
		this.population.forEach((individual, i) => {
			let assignedSpecies = null;
			species.forEach((spec, speciesIndex) => {
				// const lastPopulation = spec.population.length
				// 	? spec.population : lastSpecies[speciesIndex].population;
				const lastPopulation = spec.population;
				// Choose random individual from species
				const refIndividual = 
					lastPopulation[Math.floor(Math.random() * lastPopulation.length)];
				const matchingSets =
					this.geneMatchingSets(refIndividual.genes, individual.genes);

				let excessGenes = 0;
				let disjointGenes = 0;
				let meanWeightDelta = 0;
				let matchingGenes = 0;
				Logger.log(1, matchingSets.higher.map(g => g && g.id))
				Logger.log(1, matchingSets.lower.map(g => g && g.id))
				matchingSets.higher.forEach((id, i) => {
					// Higher matching gene
					let hGene = matchingSets.higher[i];
					// Lower matching gene
					let lGene = matchingSets.lower[i]
					if(i < matchingSets.lower.length) {
						if(!!lGene ^ !!hGene)
							disjointGenes++;
						else if(hGene) {
							// Higher weight
							const hWeight = Math.max(hGene.w, lGene.w);
							const weigthDelta =
								Math.min(
									1,
									(Math.abs(hGene.w - lGene.w) / Math.abs(hWeight))
								);
							meanWeightDelta += weigthDelta
							matchingGenes++;								
						}
					} else if(hGene)
						excessGenes++;
				});
				meanWeightDelta = matchingGenes ? meanWeightDelta / matchingGenes : 0;
				Logger.log(2, excessGenes, disjointGenes, meanWeightDelta, 'ex di');
				// Number of genes in the larger genome
				const N = matchingSets.higher.length;
				// const lowerInputDeg = NeatNetwork.getInputDegrees(matchingSets.lower);
				// const higherInputDeg = NeatNetwork.getInputDegrees(matchingSets.higher);
				// const inputDegreeDeltas = higherInputDeg.reduce((acc, deg, i) => {
				// 	return acc + (Math.abs(deg - lowerInputDeg[i]) * this.degreeDeltaW);
				// }, 0);
				// const minDegreeDelta = Math.abs(Math.min(...lowerInputDeg) - Math.min(...higherInputDeg));
				// Calulate species distance
				const gDistance = ((this.excessW * excessGenes) / N +
					(this.disjointW * disjointGenes) / N);
				const wDistance = (this.meanWeightW * meanWeightDelta);
				const speciesDistance = (gDistance + wDistance);
				// console.log(speciesDistance, gDistance, wDistance)
				// if(minDegreeDelta > 0)
					// console.log(lowerInputDeg, higherInputDeg, speciesDistance)
				Logger.log(1, 'SN:', speciesDistance);
				if(assignedSpecies === null)
					assignedSpecies = ((gDistance <= this.compatibilityThreshold) && (wDistance <= this.compatibilityThreshold)
						? speciesIndex : null);
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
		this.innovationNum ++;
		return this.innovationNum;
	}

	splitGene(genes) {
		// Split random gene
		const gIndex = Math.floor(Math.random() * genes.length);
		const splitGene = genes[gIndex];
		// Disconnect split gene from it's parent and child
		// Create new node for new genes to connect to
		if(splitGene.parent.isBias)
			return genes;
		splitGene.parent.disconnect(splitGene);
		const newNode = new GANeuron('NeS' + splitGene.id);
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
				weight: splitGene.w
			}),
			// Gene from new middle node to old child
			new Gene({
				innovation: innovations[1],
				parent: newNode,
				child: splitGene.child,
				weight: splitGene.w
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
		const {
			layerIndex: parentLayerIndex,
			geneIndex: parentIndex 
		} = this._randomGeneIndex(true, false, geneLayerMap);
		const parent = geneLayerMap[parentLayerIndex][parentIndex];
		const childSubMap = geneLayerMap.slice(parentLayerIndex + 1);
		const {
			layerIndex: childLayerIndex,
			geneIndex: childIndex 
		} = this._randomGeneIndex(true, true, childSubMap);
		const child = childSubMap[childLayerIndex][childIndex];

		const connectionExists = parent.id === child.id ||
			parent.synapses.map(syn => syn.child.id).indexOf(child.id) > -1;
		Logger.log(1, 'New Connection', parent.id, child.id, connectionExists);
		if(!connectionExists && !child.isBias && !child.isInput) {
			const geneId = Gene.idFor(parent, child);
			const innovation = this.innovation(geneId);
			return [...genes, new Gene({ innovation, parent, child })];
		} else {
			Logger.log(1, 'Connection already exists, not pushed');
			return genes;
		}
	}

	addNeuron(genes) {
		const glMap = NeatNetwork.geneLayerMap(genes);
		const { layerIndex, geneIndex } = this._randomGeneIndex(false, false, glMap);
		const baseNeuron = glMap[layerIndex][geneIndex];
		// Don't connect parent neurons to inputs
		if(baseNeuron.isInput || baseNeuron.isBias || !baseNeuron.parentSynapses.length || !baseNeuron.synapses.length)
			return genes;
		const newNeuron = new GANeuron(baseNeuron.id + 'B', false, false);
		const geneId = Gene.idFor(newNeuron, baseNeuron);
		const innovation = this.innovation(geneId);
		const newGene = new Gene({
			innovation: innovation,
			parent: newNeuron,
			child: baseNeuron.synapses[0].child
		});
		const newGene2 = new Gene({
			innovation: this.innovation(),
			parent: baseNeuron.parentSynapses[0].parent,
			child: newNeuron
		});
		return [...genes, newGene, newGene2];
	}

	addBias(genes) {
		const glMap = NeatNetwork.geneLayerMap(genes);
		const { layerIndex, geneIndex } = this._randomGeneIndex(true, false, glMap);
		const baseNeuron = glMap[layerIndex][geneIndex];
		const childNeuron = baseNeuron.synapses[
			Math.floor(Math.random() * baseNeuron.synapses.length)].child;
		// Don't connect parent neurons to inputs
		if(childNeuron.isInput || childNeuron.isBias)
			return genes;
		const parentNeuron = new GANeuron(childNeuron.id + 'B', false, false, true);
		const geneId = Gene.idFor(parentNeuron, childNeuron);
		const innovation = this.innovation(geneId);
		const newGene = new Gene({
			innovation: innovation,
			parent: parentNeuron,
			child: childNeuron
		});
		return [...genes, newGene];
	}

	_randomGeneIndex(includeInput, includeOutput, glMap) {
		const range = glMap.length - (Number(!includeInput) + Number(!includeOutput));
		const offset = Number(!includeInput);
		const layerIndex = Math.floor(Math.random() * range + offset);
		const layer = glMap[layerIndex];
		const geneIndex = Math.floor(Math.random(layer.length));
		return { layerIndex, geneIndex };
	}
}

module.exports = NeatManager;
