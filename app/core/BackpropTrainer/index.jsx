import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';

import Trainer from 'learning/trainer';
import { BackpropNetwork } from 'learning/learning';

export default class BackpropTrainer extends Component {
	static propTypes = { network: PropTypes.object };

	constructor(props) {
		super(props);
		const { network, onNetworkUpdate } = props;
		this.trainer = new Trainer(onNetworkUpdate || null, network);
	}

	handleTrainClick() {
		this.trainer.learnXOR(1000);
	}

	render() {
		return (
			<div>
				<button onClick={ ::this.handleTrainClick }>Train</button>
			</div>
		)
	}
}
