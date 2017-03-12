import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';
import { inject, observer } from 'mobx-react';
import { Engine, World, Bodies, Render } from 'matter-js';

import st from './index.scss'; 

@inject('app') @observer
export default class NetworkView extends Component {
	static propTypes = {
		layers: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.engine = Engine.create();
		this.renderer = null;
		this.renderNetwork();
	}

	componentDidMount() {
		this.renderer = Render.create({
			element: this.matterEl,
			engine: this.engine,
			options: {
				width: 900,
				height: 650
			}
		});
		Engine.run(this.engine);
		Render.run(this.renderer);
	}

	renderNetwork() {
		const { network } = this.props;
		const bodies = []; 
		console.log(network)


		World.add(this.engine.world, bodies);
	}

	render() {
		return (
			<div className={ st.Network }>
				<div ref={ el => this.matterEl = el }>
				</div>
			</div>
		);
	}
}

const Neuron = () => Bodies.circle(20, 20, 20, { isStatic: true });
