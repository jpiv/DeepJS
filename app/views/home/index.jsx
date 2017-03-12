import React, { Component } from 'react';
import ReactDom from 'react-dom';

import { Network } from 'learning/learning';
import Fn from 'learning/functions';
import NetworkView from 'core/NetworkView';

const { activation: { sigmoid, sigmoidPrime }, error: { defaultLoss, defaultLossP } } = Fn;

export default class Home extends Component {
	render() {
		const funcs = [sigmoid, sigmoidPrime, defaultLoss, defaultLossP];
		const layers = [2, 4, 1];
		return (
			<div>
				<NetworkView network={ new Network(layers, ...funcs) } />
			</div>
		)
	}
}
