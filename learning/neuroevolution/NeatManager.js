const NeatNetwork = require('./NeatNetwork.js');
const rng = require('random-word');

class NeatManager {
	constructor(options={}) {
		this.innovator = {
			total: -1,
			next() {
				this.total++;
				return this.total;
			}
		};
		this.networkOptions = options.network;
		this.populationSize = options.populationSize || 0;
		this.population = this._initialPopulation();
		this.compatibilityThreshold = options.compatibilityThreshold || 0.1;
		console.log(this.innovator, 'in pop');
		this.species = this.speciate();
	}

	_initialPopulation() {
		const net0 = new NeatNetwork(this.networkOptions, this.innovator, 'NT0');
		const population = [net0];
		for(let i = 1; i < this.populationSize; i++) {
			population.push(NeatNetwork.fromGenes(
				net0.replicateGenes(),
				this.networkOptions,
				this.innovator,
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
}

module.exports = NeatManager;
