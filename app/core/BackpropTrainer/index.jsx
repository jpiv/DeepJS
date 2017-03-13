import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';
import Immutable from 'seamless-immutable';

import { BackpropNetwork, Trainer } from 'learning/learning';
import st from './index.scss';

export default class BackpropTrainer extends Component {
	static propTypes = { network: PropTypes.object };

	constructor(props) {
		super(props);
		const { network, onNetworkUpdate } = props;
		this.trainer = new Trainer(null, network);
		this.state = Immutable({
			training: false,
			iteration: 0,
			inputs: Array.from(Array(network.inputNeurons.length).keys(), () => 0),
			output: 0
		});
	}

	handleInputChange(inputIndex, e) {
		const { value } = e.target;
		const { inputs } = this.state;
		this.state = this.state.set('inputs', inputs.map((val, i) =>
			i === inputIndex ? value : val));
		this.forceUpdate();
	}

	handleSendInput() {
		const { network } = this.props;
		const { inputs } = this.state;
		this.state = this.state.set('output', network.sendInput(inputs));
		this.forceUpdate();
	}

	handleTrainClick() {
		const { onNetworkUpdate } = this.props;
		const gen = function* () {
			this.state = this.state.set('training', true);
			for(let item of this.trainer.learnXOR(15000, true)) {
				this.state = this.state.set('iteration', item.iteration);
				this.forceUpdate();
				if(item.iteration % 50 === 0)
					yield item;
			}
			this.state = this.state.set('training', false);
		};
		onNetworkUpdate(gen.call(this));
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

	render() {
		const { iteration } = this.state;
		return (
			<div className={ st.BackpropTrainer }>
				<button onClick={ ::this.handleTrainClick }>Train</button>
				Iteration: { iteration + 1 }
				<br />
				{ this.renderInputs() }
				<button onClick={ ::this.handleSendInput }>Send Input</button>
				<br />
				<span>Output: { this.state.output }</span>	
			</div>
		)
	}
}
