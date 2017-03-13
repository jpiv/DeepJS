import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';
import Immutable from 'seamless-immutable';

import { BackpropNetwork, Trainer } from 'learning/learning';

export default class BackpropTrainer extends Component {
	static propTypes = { network: PropTypes.object };

	constructor(props) {
		super(props);
		const { network, onNetworkUpdate } = props;
		this.trainer = new Trainer(null, network);
		this.state = Immutable({ 'iteration': 0 });
	}

	handleTrainClick() {
		const { onNetworkUpdate } = this.props;
		const gen = function* () {
			for(let item of this.trainer.learnXOR(15000, true)) {
				this.state = this.state.set('iteration', item.iteration);
				this.forceUpdate();
				if(item.iteration % 10 === 0)
					yield item;
			}
		};
		onNetworkUpdate(gen.call(this));
	}

	render() {
		const { iteration } = this.state;
		return (
			<div>
				<button onClick={ ::this.handleTrainClick }>Train</button>
				Iteration: { iteration + 1 }
			</div>
		)
	}
}
