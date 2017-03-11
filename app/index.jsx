import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'mobx-react';

import App from 'app/app';
import stores from './stores/stores';

document.onreadystatechange = () => {
	if (document.readyState == 'interactive') 
		ReactDom.render(
			<Provider { ...stores }><App /></Provider>,
			document.getElementById('main')
		);
};
