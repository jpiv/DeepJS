import { observable, action } from 'mobx';
import { API_URL, CSRF_TOKEN } from '../../config';

export default class AppStore {
	@observable items = null;
	@observable loading = true;

	@action.bound
	fetch() {
		this.loading = true;
		// return fetch(`${API_URL}/jobs?current=true`, {
		// 	credentials: 'include',
		// 	headers: {
		// 		'X-CSRFToken': CSRF_TOKEN
		// 	}
		// }).then(res => res.json()).then(res => {
		// 	this.items = res._items;
		// 	this.loading = false;
		// });
	}
};
