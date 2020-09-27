// Vue.
import App from '@/App.vue';
import Vue from 'vue';

import './styles/global.less';

new Vue({
  components: { App },
  template: '<app />',
}).$mount('#app');
