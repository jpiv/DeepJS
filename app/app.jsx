import React, { Component } from 'react';
import ReactDom from 'react-dom';

import st from './app.scss';
import { inject } from 'mobx-react';
import Home from './views/home'

@inject('app')
export default class App extends Component {
	constructor(props) {
		super(props);

		this.fetchInitialData();
	}

	async fetchInitialData() {
		const { app } = this.props;
		const response = await app.fetch();
	}

	render() {
		return (
			<div className={ st.app }>
				<Home />
			</div>
		)
	}
}
