// Vue.
import App from '@/App.vue';
import Vue from 'vue';
import './status-controller';
import './styles/global.less';

import { Menu } from './modules/menu';

const menu = new Menu();
menu.on('any', action => console.log('clicked ' + action));

new Vue({
  components: { App },
  template: '<app />',
}).$mount('#app');
