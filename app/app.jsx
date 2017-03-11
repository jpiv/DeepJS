import React, { Component } from 'react';
import ReactDom from 'react-dom';

import st from './app.scss';
import { inject } from 'mobx-react';
import Jobs from './views/Jobs'

@inject('jobs')
export default class App extends Component {
	constructor(props) {
		super(props);

		this.fetchInitialData();
	}

	async fetchInitialData() {
		const { jobs } = this.props;
		const response = await jobs.fetch();
	}

	render() {
		return (
			<div className={ st.app }>
				<Jobs />
			</div>
		)
	}
}
