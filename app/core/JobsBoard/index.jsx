import React, { Component } from 'react';
import ReactDom from 'react-dom';

import JobsBoard from 'core/JobsBoard'
import { inject, observer } from 'mobx-react';
import st from './index.scss'; 

@inject('jobs') @observer
export default class Jobs extends Component {
	renderJobRows() {
		const { jobs } = this.props;
		return jobs.items.map((job, i) => <JobRow key={ i } job={ job } />);
	}

	render() {
		const { loading } = this.props.jobs;
		return (
			<div className={ st.JobsBoard }>
				{ loading && 'LOADING JORBS' }
				{ !loading && this.renderJobRows() }
			</div>
		)
	}
}

class JobRow extends Component {
	render() {
		const { job } = this.props;
		const orderIds = Object.keys(job.orders);
		var partIds = [];
		orderIds.forEach(oId =>
			partIds = [...partIds, ...Object.keys(job.orders[oId].order.parts)])
		const imageUrl = job
			.orders[orderIds[0]].order
			.parts[partIds[0]].part
			.revisions[0]
			.images[0].url;
		return (
			<div>
				<div>{ job._id }</div>
				<img width={ 45 } height={ 45 } src={ imageUrl } />
			</div>
		);
	}
}