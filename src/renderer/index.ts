// Vue.
import App from '@/App.vue';
import Vue from 'vue';
import './status-controller';
import './styles/global.less';

// @ts-ignore
import { Menu } from './modules/menu';

new Vue({
  components: { App },
  template: '<app />',
}).$mount('#app');
