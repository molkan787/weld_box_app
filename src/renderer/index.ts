// Vue.
import App from '@/components/App.vue';
import Vue from 'vue';
import './status-controller';
import './styles/global.less';
import VModal from 'vue-js-modal';

// @ts-ignore
import { store } from './store';
import './modules/menu';
import { test } from './test';

Vue.use(VModal);

new Vue({
  components: { App },
  template: '<app />',
  store
}).$mount('#app');

setTimeout(() => test(), 500);
