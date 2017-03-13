import React, { Component } from 'react';
import ReactDom from 'react-dom';

import { BackpropNetwork } from 'learning/learning';
import Fn from 'learning/functions';
import NetworkView from 'core/NetworkView';

const { activation: { sigmoid, sigmoidPrime }, error: { defaultLoss, defaultLossP } } = Fn;

export default class Home extends Component {
	render() {
		const funcs = [sigmoid, sigmoidPrime, defaultLoss, defaultLossP];
		const layers = [2, 2, 3, 1];
		return (
			<div>
				<NetworkView
					width={ 900 }
					height={ 650 }
					network={ new BackpropNetwork(layers, ...funcs) } />
			</div>
		)
	}
}
