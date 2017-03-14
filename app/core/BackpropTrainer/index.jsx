import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';
import Immutable from 'seamless-immutable';
import { inject } from 'mobx-react';

import { BackpropNetwork, Trainer } from 'learning/learning';
import { division, XOR } from 'learning/setGenerator';
import st from './index.scss';

const operators = {
	xor: {
		name: 'XOR',
		method: (trainer, n) => trainer.learnXOR(n, true),
		setGen: XOR
	},
	division: {
		name: 'Division',
		method: (trainer, n) => trainer.learnDivision(n, true),
		setGen: division
	} 
};

@inject('app')
export default class BackpropTrainer extends Component {
	static propTypes = {
		network: PropTypes.object,
		app: PropTypes.object
	};

	constructor(props) {
		super(props);
		const { network, onNetworkUpdate } = props;
		this.trainer = new Trainer(null, network);
		this.state = Immutable({
			inputs: Array.from(Array(network.inputNeurons.length).keys(), () => 0),
			operator: operators.xor,
			layers: [2, 5, 1],
			training: false,
			iteration: 0,
			output: 0,
			error: 0,
			setSize: 15000
		});
	}

	handleInputChange(inputIndex, e) {
		const { value } = e.target;
		const { inputs } = this.state;
		this.state = this.state.set('inputs', inputs.map((val, i) =>
			i === inputIndex ? value : val));
		this.forceUpdate();
	}

	handleSetSizeChange(e) {
		const { value } = e.target;
		this.state = this.state.set('setSize', Number(value));
		this.forceUpdate();
	}

	handleSendInput() {
		const { network } = this.props;
		const { inputs } = this.state;
		this.state = this.state.set('output', network.sendInput(inputs));
		this.forceUpdate();
	}

	handleOperatorSelectChange(e) {
		const { value } = e.target;
		this.state = this.state.set('operator', operators[value]);
		this.forceUpdate();
	}

	handleLayerChange(key, e) {
		const { value } = e.target;
		const { layers } = this.state;
		const { network, app } = this.props;
		const newLayers = layers.map((l, i) => (key + 1) === i ? Number(value) : l);
		this.state = this.state.set('layers', newLayers);
		network.layers = newLayers.asMutable();
		this.props.app.networkSync++;
		this.forceUpdate();
	}

	handleAddLayer() {
		const { layers } = this.state;
		this.state = this.state.set('layers',
			[...layers.slice(0, -1), 2, layers[layers.length - 1]]);
		this.handleLayerChange(layers.length - 2, { target: { value: 2 } });
	}

	handleTrainClick() {
		const { onNetworkUpdate, network, app } = this.props;
		const { operator, setSize } = this.state;
		const gen = function* () {
			this.state = this.state.set('training', true);
			for(let item of operator.method(this.trainer, setSize)) {
				if(item.iteration % 50 === 0){
					this.state = this.state.merge({
						iteration: item.iteration,
						error: item.result.error
					});
					this.forceUpdate();
					yield item;
				}
			}
			const error = network.test(operator.setGen(20));
			this.state = this.state.merge({
				iteration: setSize,
				training: false,
				error
			});
			this.forceUpdate();
		};
		onNetworkUpdate(gen.call(this));
	}

	resetNetwork() {
		const { network, app } = this.props;
		network.reconstruct();
		this.state = this.state.merge({
			error: 0,
			iteration: 0
		});
		app.networkSync++;
		this.forceUpdate();
	}

	renderInputs() {
		const { inputs } = this.state;
		return inputs.map((val, i) =>
			<span key={ i }>
				Input: <input
					type="text"
					value={ val }
					onChange={ this.handleInputChange.bind(this, i) } />
				<br />
			</span>);
	}

	renderOperatorOptions() {
		const { operator } = this.state;
		return Object.keys(operators).map((key) =>
			<option
				value={ key }
				key={ key }>
				{ operators[key].name }
			</option>);
	}

	renderWeights() {
		const { network } = this.props;
		const weights = [];
		network.networkAction((n, layer, index) =>
			n.synapses.forEach(syn => weights.push(syn.w)));
		return weights.map((w, i) => <div key={ i }>W{i}: {w}</div>)
	}

	renderLayerInputs() {
		const { layers } = this.state;
		const layerInputs = layers.slice(1, -1).map((size, i) =>
			<div key={ i }>
				<input
					type="text"
					onChange={ this.handleLayerChange.bind(this, i) }
					value={ size } />
			</div>);
		return [...layerInputs, <button
			key={ layers.length }
			onClick={ ::this.handleAddLayer }>+ Add Layer</button>]
	}

	render() {
		const { iteration, output, error, operator, setSize } = this.state;
		return (
			<div className={ st.BackpropTrainer }>
				<div className={ st.col }>
					<input type="text" onChange={ ::this.handleSetSizeChange } value={ setSize } />
					<br />
					<button onClick={ ::this.handleTrainClick }>Train</button>
					<button onClick={ ::this.resetNetwork }>Reset</button>
					<br />
					Iteration: { iteration }
					<br />
					{ this.renderInputs() }
					<button onClick={ ::this.handleSendInput }>Send Input</button>
					<br />
					<span>Output: { output }</span>	
					<br />
					<span>Error: { (error * 100).toFixed(2) }%</span>
					{ this.renderLayerInputs() }
				</div>
				<div className={ st.col }>
					<select value={ operator.key } onChange={ ::this.handleOperatorSelectChange }>
						{ this.renderOperatorOptions() }
					</select>
					{ this.renderWeights() }
				</div>
			</div>
		)
	}
}
