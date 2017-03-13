import React, { Component } from 'react';
import ReactDom from 'react-dom';

import { BackpropNetwork } from 'learning/learning';
import Fn from 'learning/functions';
import NetworkView from 'core/NetworkView';
import BackpropTrainer from 'core/BackpropTrainer';
import st from './index.scss';

const { activation: { sigmoid, sigmoidPrime }, error: { defaultLoss, defaultLossP } } = Fn;

export default class Home extends Component {
	constructor(props) {
		super(props);
		const funcs = [sigmoid, sigmoidPrime, defaultLoss, defaultLossP];
		const layers = [2, 5, 1];
		this.state = { 
			network: new BackpropNetwork(layers, ...funcs),
			updater: null
		};
	}

	onNetworkUpdate(updater) {
		this.setState({ updater });
	}

	render() {
		const { network, updater } = this.state;
		return (
			<div className={ st.Home }>
				<NetworkView
					width={ 900 }
					height={ 650 }
					network={ network } 
					updater={ updater } />
				<BackpropTrainer
					network={ network }
					onNetworkUpdate={ ::this.onNetworkUpdate } />
			</div>
		)
	}
}
