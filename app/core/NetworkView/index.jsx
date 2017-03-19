import React, { Component, PropTypes } from 'react';
import ReactDom from 'react-dom';
import { inject, observer } from 'mobx-react';
import {
	Engine,
	World,
	Bodies,
	Body,
	Render,
	Vector,
	Constraint,
	Events
} from 'matter-js';

import st from './index.scss'; 

const NEUR_RADIUS = 20;
const SYN_THICKNESS = 1;

@inject(store => ({ sync: store.app.networkSync }))
@observer
export default class NetworkView extends Component {
	static propTypes = {
		layers: PropTypes.object,
		iteration: PropTypes.number
	};

	constructor(props) {
		super(props);
		this.engine = Engine.create();
		this.renderer = null;
	}

	componentDidMount() {
		const { width, height, network } = this.props;
		this.renderer = Render.create({
			element: this.matterEl,
			engine: this.engine,
			options: { width, height }
		});
		Engine.run(this.engine);
		Render.run(this.renderer);
		this.renderNetwork(network);
	}

	componentDidUpdate() {
		const { updater, network } = this.props;
		updater && Events.on(this.renderer, 'beforeRender', ::this.refresh);
		this.renderNetwork(network);
	}

	refresh() {
		const { updater } = this.props;
		const next = updater.next();
		if(!next.done) {
			this.renderNetwork(next.value.network);
		}
		else
			Events.off(this.renderer, 'beforeRender');
	}

	renderNetwork(network) {
		const { width, height } = this.props;
		const layers = network.network;
		const layerHeight = height / layers.length;
		const bodies = [];
		const getX = (l, i, n) => {
			const neuronSpacing = width / n;
			return (neuronSpacing * i) + (neuronSpacing / 2); 
		};
		const getY = l => (layerHeight * l) + (layerHeight / 2);
		const getBodyIndex = (layer, index) => {
			return layers.reduce((acc, l) => {
				const layerIndex = layers.indexOf(l);
				if(layerIndex < layer)
					return acc + l.length;
				else if(layerIndex === layer)
					return acc += index;
				else
					return acc;
			}, 0);
		};
		World.clear(this.engine.world);

		// Create Neurons
		network.networkAction((n, layer, index) => {
			const x = getX(layer, index, layers[layer].length); 
			const y = getY(layer);
			bodies.push(NeuronBody(x, y)); 
		});

		// Create Synapses
		network.networkAction((n, layer, index) => {
			n.synapses.forEach(syn => {
				const childIndex = layers[layer + 1].indexOf(syn.child);
				const bAIndex = getBodyIndex(layer, index);
				const bBIndex = getBodyIndex(layer + 1, childIndex);
				const bA = bodies[bAIndex];
				const bB = bodies[bBIndex];
				bodies.push(SynapseBody(bA, bB, syn.w));
			});
		});
		World.add(this.engine.world, bodies);
	}

	render() {
		return (
			<div className={ st.NetworkView }>
				<div ref={ el => this.matterEl = el } />
			</div>
		);
	}
}

const NeuronBody = (x, y) => Bodies.circle(x, y, NEUR_RADIUS, {
		isStatic: true
	});
const SynapseBody = (bodyA, bodyB, weight) =>
	Constraint.create({
		bodyA,
		bodyB,
		pointA: Vector.create(0, NEUR_RADIUS),
		pointB: Vector.create(0, -NEUR_RADIUS),
		render: {
			lineWidth: Math.min(Math.max(SYN_THICKNESS * Math.abs(weight), SYN_THICKNESS), SYN_THICKNESS * 3),
			strokeStyle: Math.sign(weight) < 0 ? 'red' : 'green',
			isStatic: true
		}
	});