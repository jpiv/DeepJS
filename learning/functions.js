const Fn = {
	fitness: {
		xor: (inputs, outputs) =>
			1 - Math.abs(Fn.general.xor(inputs[0], inputs[1]) - outputs[0]),
		and: (inputs, outputs) =>
			1 - Math.abs(Number(inputs[0] && inputs[1]) - outputs[0]),
		xor3: (inputs, outputs) =>
			1 - Math.abs(inputs[0] ^ inputs[1] ^ inputs[2])
	},
	general: {
		xor: (i1, i2) => (i1 ^ i2)
	},
	activation: {
		sigmoid: x =>
			1 / (1 + Math.exp(-x)),
		sigmoidPrime: x =>
			Fn.activation.sigmoid(x) * (1 - Fn.activation.sigmoid(x)),
		linear: x => x
	},
	error: {
		defaultLoss: (e, o) =>
			e * Fn.activation.sigmoid(o) * (1- Fn.activation.sigmoid(o)),
		defaultLossP: (childErr, childSum, parentOutput) =>
			childErr * Fn.activation.sigmoidPrime(childSum) * parentOutput,
		meanAbsoluteError(errorRates) { 
			let totalError = errorRates[0].map((rate, i) =>
				errorRates.reduce((acc, err) =>
					acc + Math.abs(err[i]), 0) / errorRates.length);
			return totalError;
		},
		meanSquaredError(errorRates) { 
			let totalError = errorRates[0].map((rate, i) =>
				errorRates.reduce((acc, err) =>
					acc + Math.pow(err[i], 2), 0) / errorRates.length);
			return totalError;
		}
	}
};

module.exports = Fn;
