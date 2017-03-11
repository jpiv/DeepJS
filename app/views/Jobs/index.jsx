import React, { Component } from 'react';
import ReactDom from 'react-dom';

import JobsBoard from 'core/JobsBoard'

export default class Jobs extends Component {
	render() {
		return (
			<div>
				<JobsBoard />
			</div>
		)
	}
}
