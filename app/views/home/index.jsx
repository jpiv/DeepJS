import React, { Component } from 'react';
import ReactDom from 'react-dom';

import { BackpropNetwork } from 'learning/learning';
import Fn from 'learning/functions';
import NetworkView from 'core/NetworkView';
import BackpropTrainer from 'core/BackpropTrainer';

const { activation: { sigmoid, sigmoidPrime }, error: { defaultLoss, defaultLossP } } = Fn;

export default class Home extends Component {
	constructor(props) {
		super(props);
		this.state = { networkViewEl: null };
	}

	onNetworkViewRef(ref) {
		this.setState({ networkViewEl: ref });
	}

	render() {
		const { networkViewEl } = this.state;
		const funcs = [sigmoid, sigmoidPrime, defaultLoss, defaultLossP];
		const layers = [2, 2, 3, 1];
		const network = new BackpropNetwork(layers, ...funcs);
		return (
			<div>
				<NetworkView
					onRef={ ::this.onNetworkViewRef }
					width={ 900 }
					height={ 650 }
					network={ network } />
				{ networkViewEl && <BackpropTrainer
					network={ network }
					onNetworkUpdate={ networkViewEl.refresh.bind(networkViewEl) } /> }
			</div>
		)
	}
}
