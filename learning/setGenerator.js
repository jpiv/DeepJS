const binarySampleGenerator = function* (size, dimensions) {
	while(1) {
		let sample = Array.from(Array(dimensions).keys(), () => 0);
		const generateSample = function* (currentDim) {
			if(currentDim > 0) {
				currentDim--;
				for(let i = 0; i <= 1; i++) {
					sample[currentDim] = i;
					if(currentDim === 0) yield Array.from(sample);
					else yield* generateSample(currentDim);
				}
			}
		};
		yield* generateSample(dimensions);
	}
};

const randomSampleGenerator = function* (size, dimensions, range, offset) {
	while(1) {
		yield Array.from(Array(dimensions).keys(), () => Math.random() * range + offset);
	}
};

module.exports = {
	randomSampleGenerator,
	binarySampleGenerator,
	mutualXOR(size) {
		const samples = sampleGenerator(size, 3);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [inputs[0] ^ inputs[1], inputs[1] ^ inputs[2]];
			return { ideal, inputs };
		}); 
	},

	XOR(size) {
		const samples = binarySampleGenerator(size, 2);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [inputs[0] ^ inputs[1]];
			return { ideal, inputs };
		}); 
	},

	NOT(size) {
		const samples = binarySampleGenerator(size, 1);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [Number(!inputs[0])]
			return { ideal, inputs };
		});
	},

	AND(size) {
		const samples = binarySampleGenerator(size, 2);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [inputs[0] & inputs[1]];
			return { ideal, inputs };
		});
	},

	XOR3(size) {
		const samples = binarySampleGenerator(size, 3);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [(inputs[0] ^ inputs[1]) ^ inputs[2]];
			return { ideal, inputs };
		}); 
	},

	division(size) {
		const samples = randomSampleGenerator(size, 2, 20, 1);
		return Array.from(Array(size).keys(), i => {
			const inputs = samples.next().value;
			const ideal = [inputs[0] / inputs[1]];
			return { ideal, inputs };
		}); 
	}
};
